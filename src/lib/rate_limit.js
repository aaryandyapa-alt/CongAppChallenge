"use strict";

// SERVER ONLY (imported by src/app/api/extract+api.js): limits how often one device can use the AI, to protect the
// Claude budget once the app is public (the app token is inside the app, so anyone could find it).
//
// EAS Hosting runs on Cloudflare Workers: each request can land on a different running copy, so counts kept in memory
// barely limit anything. The counts live in Upstash Redis instead (UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN,
// server-only, set in the EAS production environment), which every copy shares. Without those, or if Upstash can't be
// reached, it falls back to counting in memory so the AI keeps working. The spend limit on the Claude account stays the
// hard ceiling.

// per device (by IP address): a burst limit and a daily limit. Filling in a run takes one request, and Try again one more
const LIMITS = [
    { name: "burst", window_ms: 10 * 60 * 1000, max: 6, wait_text: "a few minutes" },
    { name: "day", window_ms: 24 * 60 * 60 * 1000, max: 25, wait_text: "tomorrow" },
];
// for everyone together: a backstop if many addresses are used at once
const GLOBAL_LIMIT = { name: "all", window_ms: 60 * 60 * 1000, max: 400, wait_text: "a little while" };
// give up on Upstash quickly rather than keep the user waiting
const UPSTASH_TIMEOUT_MS = 1500;

/**
 * Checks one request against the limits and, if it's allowed, counts it.
 *
 * @param {string} ip - The caller's address (X-Real-IP on EAS Hosting); "unknown" if there's none.
 * @param {number} now - The time, in ms (for testing).
 * @returns {Promise<{allowed: true} | {allowed: false, wait_text: string}>}
 */
export async function check_rate_limit(ip, now = Date.now())
{
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (url && token)
    {
        try
        {
            return await check_shared(url, token, ip, now);
        }
        catch (error)
        {
            console.warn("Upstash rate limit unavailable, counting in memory:", error?.message);
        }
    }
    return check_in_memory(ip, now);
}

// ---- shared counts (Upstash Redis) ----

// Fixed windows: one counter per device per window (e.g. this 10 minutes), which expires when the window ends.
function shared_counters(ip, now)
{
    const per_device = LIMITS.map((limit) => ({ limit, key: `rl:${limit.name}:${ip}:${Math.floor(now / limit.window_ms)}` }));
    const everyone = { limit: GLOBAL_LIMIT, key: `rl:${GLOBAL_LIMIT.name}:${Math.floor(now / GLOBAL_LIMIT.window_ms)}` };
    return [everyone, ...per_device];
}

async function upstash(url, token, commands)
{
    const response = await fetch(`${url.replace(/\/$/, "")}/pipeline`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(commands),
        signal: AbortSignal.timeout(UPSTASH_TIMEOUT_MS),
    });
    if (!response.ok)
        throw new Error(`Upstash answered ${response.status}`);
    const results = await response.json();
    const failed = results.find((r) => r.error);
    if (failed)
        throw new Error(failed.error);
    return results.map((r) => r.result);
}

// Reads the counts first and only counts the request if it's allowed, so turned-away requests don't use up anyone's
// allowance (a device spamming the server mustn't push the shared count up and lock everyone else out). Two requests
// arriving at the same moment can both slip under a limit by one; that's fine here.
async function check_shared(url, token, ip, now)
{
    const counters = shared_counters(ip, now);
    const counts = await upstash(url, token, counters.map(({ key }) => ["GET", key]));
    for (let i = 0; i < counters.length; i++)
    {
        if (Number(counts[i] ?? 0) >= counters[i].limit.max)
            return { allowed: false, wait_text: counters[i].limit.wait_text };
    }

    // create each counter with its expiry if it's new (SET ... NX), then add one
    const commands = [];
    for (const { limit, key } of counters)
    {
        const seconds_left = Math.ceil((limit.window_ms - (now % limit.window_ms)) / 1000);
        commands.push(["SET", key, "0", "EX", String(seconds_left), "NX"], ["INCR", key]);
    }
    await upstash(url, token, commands);
    return { allowed: true };
}

// ---- fallback: counts in this running copy's memory ----

// forget devices that haven't been seen for a day, so memory doesn't grow
const LONGEST_WINDOW = Math.max(...LIMITS.map((l) => l.window_ms));

// IP address -> times of their recent requests (ms), oldest first
const recent = new Map();
const everyone = [];

function drop_older_than(times, cutoff)
{
    while (times.length > 0 && times[0] <= cutoff)
        times.shift();
}

function check_in_memory(ip, now)
{
    drop_older_than(everyone, now - GLOBAL_LIMIT.window_ms);
    if (everyone.length >= GLOBAL_LIMIT.max)
        return { allowed: false, wait_text: GLOBAL_LIMIT.wait_text };

    const times = recent.get(ip) ?? [];
    drop_older_than(times, now - LONGEST_WINDOW);
    for (const limit of LIMITS)
    {
        const in_window = times.filter((t) => t > now - limit.window_ms).length;
        if (in_window >= limit.max)
            return { allowed: false, wait_text: limit.wait_text };
    }

    times.push(now);
    recent.set(ip, times);
    everyone.push(now);

    // now and then, forget devices whose requests have all expired
    if (recent.size > 5000)
    {
        for (const [key, list] of recent)
        {
            drop_older_than(list, now - LONGEST_WINDOW);
            if (list.length === 0)
                recent.delete(key);
        }
    }
    return { allowed: true };
}
