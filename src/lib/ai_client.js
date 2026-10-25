"use strict";

import fake_response from "./fake_ai_response.json";

/**
 * Sends the five Simple-mode answers to the AI extraction proxy in one call.
 * The proxy holds the LLM API key, so it never ships inside the app.
 *
 * Request:  POST { answers: { steps, workers, times, arrivals, hours } }
 * Response: { schema, missing_fields }, where schema is in the input-schema format (runs/test-1/input_schema.json)
 *           with null for anything the AI couldn't tell. The app stars null fields (see schema_to_form);
 *           missing_fields lists the same fields and is kept for reference.
 */

// no proxy yet: use the fake response until it exists, then set PROXY_URL and turn this off
const USE_FAKE = true;
const PROXY_URL = "";
const TIMEOUT_MS = 30000;

// the five questions, worded exactly as decided
export const QUESTIONS = [
    { key: "steps", text: "What are the steps someone goes through, in order?" },
    { key: "workers", text: "How many people work at each step?" },
    { key: "times", text: "About how long does each step take, and does it vary a lot or stay pretty consistent?" },
    { key: "arrivals", text: "About how many people come in per hour, and is there a busier time of day?" },
    { key: "hours", text: "When do you open and close?" },
];

// thrown when the AI can't be reached or gives back something unusable
export class AiUnreachableError extends Error {}

/**
 * @param {object} answers - { steps, workers, times, arrivals, hours }, each the text the user typed.
 * @returns {Promise<{schema: object, missing_fields: string[]}>}
 * @throws {AiUnreachableError} No connection, the proxy failed, it took too long, or the reply wasn't JSON.
 */
export async function extract(answers)
{
    if (USE_FAKE)
        return await fake_extract(answers);

    // give up after TIMEOUT_MS
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try
    {
        const response = await fetch(PROXY_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ "answers": answers }),
            signal: controller.signal,
        });
        if (!response.ok)
            throw new AiUnreachableError(`The proxy answered with status ${response.status}`);
        const body = await response.json();
        return { schema: body?.["schema"] ?? null, missing_fields: body?.["missing_fields"] ?? [] };
    }
    catch (e)
    {
        throw e instanceof AiUnreachableError ? e : new AiUnreachableError(e?.message ?? String(e));
    }
    finally
    {
        clearTimeout(timer);
    }
}

// TEMPORARY until the proxy exists. Waits like a real call, then returns fake_ai_response.json (which has a few blanks).
// For testing the other paths, start the first answer with:
//   "fail"    -> no stations come back (the "we didn't catch anything" path)
//   "offline" -> the AI can't be reached (the Try again / Fill in myself path)
async function fake_extract(answers)
{
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const first = (answers["steps"] ?? "").trim().toLowerCase();
    if (first.startsWith("offline"))
        throw new AiUnreachableError("Fake: no connection");
    if (first.startsWith("fail"))
        return { schema: { "stations": null }, missing_fields: ["stations"] };
    return structuredClone(fake_response);
}
