"use strict";

import fake_response from "./fake_ai_response.json";

/**
 * Sends the five Simple-mode answers to the AI extraction proxy in one call.
 * The proxy is the server route src/app/api/extract+api.js, which holds the Claude API key, so it never ships inside the app.
 *
 * Request:  POST { answers: { steps, workers, times, arrivals, hours } }
 * Response: { schema, missing_fields }, where schema is in the input-schema format (runs/test-1/input_schema.json)
 *           with null for anything the AI couldn't tell. The app stars null fields (see schema_to_form);
 *           missing_fields lists the same fields and is kept for reference.
 */

// true until the Claude API key is set up (see the setup notes in src/app/api/extract+api.js); then turn this off
const USE_FAKE = true;
// where the route is: during development "/api/extract" goes to the Expo dev server on the computer;
// for the deployed app, set EXPO_PUBLIC_AI_PROXY_URL to the EAS Hosting address (it isn't secret)
const PROXY_URL = process.env.EXPO_PUBLIC_AI_PROXY_URL || "/api/extract";
// a shared code sent with every request so the proxy can turn away casual use of its address. It's inside the app,
// so it's a deterrent, not real security (that's the spend limit on the Claude account).
const APP_TOKEN = process.env.EXPO_PUBLIC_AI_APP_TOKEN || "";
const TIMEOUT_MS = 30000;

// the five questions, worded exactly as decided (in their own file so the phone and the server use the same text)
export { QUESTIONS } from "./questions.js";

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
            // the shared app token, if one is set (see the proxy's setup notes); empty is fine while it isn't
            headers: { "Content-Type": "application/json", "x-app-token": APP_TOKEN },
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
