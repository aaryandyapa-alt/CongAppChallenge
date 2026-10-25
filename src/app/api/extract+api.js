import Anthropic from "@anthropic-ai/sdk";

import { build_user_message, check_answers, EXTRACTION_SCHEMA, extraction_to_schema, SYSTEM_PROMPT } from "../../lib/ai_extraction.js";

/**
 * POST /api/extract: the AI extraction proxy. This is server code (the "+api" in the file name): it runs on the
 * Expo dev server during development and on EAS Hosting when deployed, never on the phone. The Claude API key is
 * read from the server's environment (ANTHROPIC_API_KEY), so it never ships inside the app.
 *
 * Request:  { answers: { steps, workers, times, arrivals, hours } }
 * Response: { schema, missing_fields } (see extraction_to_schema in src/lib/ai_extraction.js)
 *
 * Setup:
 *   Local testing: put ANTHROPIC_API_KEY=... in a file named .env.local in the project folder (git ignores it),
 *     then restart `npx expo start`.
 *   Deployed: save ANTHROPIC_API_KEY in EAS as a "Sensitive" environment variable (EAS Hosting can't use "Secret"),
 *     then `npx expo export --platform web` and `npx eas-cli@latest deploy --environment production`.
 *   App token (optional): set AI_APP_TOKEN on the server and EXPO_PUBLIC_AI_APP_TOKEN in the app to the same
 *     random text; requests without it are then turned away. See .env.example.
 */

// Claude Haiku 5.5: the low-cost model, chosen to keep each extraction well under a cent
const MODEL = "claude-haiku-5-5";

export async function POST(request)
{
    // a shared code the app sends with every request, to turn away casual use of the public address (it's inside the
    // app, so it isn't real security; the spend limit on the Claude account is). Only checked once AI_APP_TOKEN is set.
    const app_token = process.env.AI_APP_TOKEN;
    if (app_token && request.headers.get("x-app-token") !== app_token)
        return Response.json({ error: "Not allowed." }, { status: 401 });

    let body;
    try
    {
        body = await request.json();
    }
    catch
    {
        return Response.json({ error: "The request wasn't valid JSON." }, { status: 400 });
    }
    const problem = check_answers(body);
    if (problem !== null)
        return Response.json({ error: problem }, { status: 400 });

    if (!process.env.ANTHROPIC_API_KEY)
        return Response.json({ error: "The server has no Claude API key set up." }, { status: 500 });

    // reads ANTHROPIC_API_KEY from the environment
    const client = new Anthropic();
    let response;
    try
    {
        response = await client.messages.create({
            model: MODEL,
            max_tokens: 8000,
            system: SYSTEM_PROMPT,
            output_config: {
                // a simple extraction: low effort keeps it quick and cheap
                effort: "low",
                // structured outputs: the reply is guaranteed to be JSON in this shape
                format: { type: "json_schema", schema: EXTRACTION_SCHEMA },
            },
            messages: [{ role: "user", content: build_user_message(body["answers"]) }],
        });
    }
    catch (error)
    {
        // most specific first: a bad key, too many requests, then any other API or network failure
        if (error instanceof Anthropic.AuthenticationError)
            return Response.json({ error: "The server's Claude API key was rejected." }, { status: 502 });
        if (error instanceof Anthropic.RateLimitError)
            return Response.json({ error: "Too many requests to the AI right now. Try again in a moment." }, { status: 503 });
        if (error instanceof Anthropic.APIError)
            return Response.json({ error: `The AI service failed (${error.status ?? "no status"}).` }, { status: 502 });
        return Response.json({ error: "Couldn't reach the AI service." }, { status: 502 });
    }

    // a declined or cut-off reply may not be complete JSON
    if (response.stop_reason === "refusal" || response.stop_reason === "max_tokens")
        return Response.json({ error: `The AI couldn't finish (${response.stop_reason}).` }, { status: 502 });

    const text = response.content.find((block) => block.type === "text")?.text;
    let extraction;
    try
    {
        extraction = JSON.parse(text);
    }
    catch
    {
        return Response.json({ error: "The AI's reply wasn't valid JSON." }, { status: 502 });
    }

    return Response.json(extraction_to_schema(extraction));
}
