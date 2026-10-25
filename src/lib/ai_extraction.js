"use strict";

import { BURST_FRACS, VARIANCE_RATIOS } from "./form_to_schema.js";
import { QUESTIONS } from "./questions.js";

/**
 * The AI extraction, minus the network call: what the model is told, the JSON shape it must answer in, checks on
 * the request, and turning the model's answer into the input schema the app uses.
 * Used only by the server route src/app/api/extract+api.js (no API key or secret here); kept separate so it can be
 * tested without calling the AI.
 *
 * The model fills a simple "extraction" (station names, minutes, Low/Medium/High variance, clock times), which is
 * easier for it to get right than our input schema; extraction_to_schema then converts it, using the same
 * Low/Medium/High values as the rest of the app.
 */

// the five answers the phone sends, in question order
export { QUESTIONS };
export const ANSWER_KEYS = QUESTIONS.map((q) => q.key);
// the same limit as the answer boxes on the questions screen
export const MAX_ANSWER_LENGTH = 1000;

// a JSON schema value that may also be null (the model uses null for anything it can't tell)
const or_null = (schema) => ({ anyOf: [schema, { type: "null" }] });
const LEVEL = { type: "string", enum: ["low", "medium", "high"] };

// the shape the model must answer in (structured outputs: every object needs additionalProperties false)
export const EXTRACTION_SCHEMA = {
    type: "object",
    additionalProperties: false,
    required: ["stations", "arrival_type", "arrivals_per_hour", "peak_time", "burst_level", "open_time", "close_time"],
    properties: {
        stations: or_null({
            type: "array",
            items: {
                type: "object",
                additionalProperties: false,
                required: ["name", "customer_led", "workers", "minutes", "variance"],
                properties: {
                    name: or_null({ type: "string" }),
                    customer_led: or_null({ type: "boolean" }),
                    workers: or_null({ type: "integer" }),
                    minutes: or_null({ type: "number" }),
                    variance: or_null(LEVEL),
                },
            },
        }),
        arrival_type: or_null({ type: "string", enum: ["consistent", "bursty"] }),
        arrivals_per_hour: or_null({ type: "number" }),
        peak_time: or_null({ type: "number" }),
        burst_level: or_null(LEVEL),
        open_time: or_null({ type: "number" }),
        close_time: or_null({ type: "number" }),
    },
};

export const SYSTEM_PROMPT = `You turn a food bank, pantry or clinic's description of how people move through their site into structured data for a queue simulation.

The staff answered five questions in their own words. Fill in the JSON from what they said or clearly implied. If something wasn't said and can't be reasonably inferred, use null rather than guessing; staff will review every value afterwards, and blanks are shown to them for checking.

- stations: the steps a person goes through, in order. Use null if no steps were described at all.
  - name: a short name for the step, like "Intake" or "Groceries".
  - customer_led: true if people do this step themselves with no worker (like picking items from shelves), false if workers serve them.
  - workers: how many people work at this step (a whole number). Use 0 for customer-led steps.
  - minutes: about how long one person spends at this step, in minutes. If a range is given, use the middle.
  - variance: how much that time varies from person to person: "low" (pretty consistent), "medium" (varies some) or "high" (varies a lot).
- arrival_type: "bursty" if they mention a busier time of day, "consistent" if they say it's about the same all day, null if they don't say.
- arrivals_per_hour: about how many people come in per hour on average. If a range is given, use the middle.
- peak_time: the busiest time of day, only for bursty arrivals, as hours since midnight on a 24-hour clock (1:30 PM is 13.5).
- burst_level: how much busier the busiest time is: "low" (a little busier), "medium" (noticeably busier) or "high" (much busier). Only for bursty arrivals.
- open_time and close_time: opening and closing time, as hours since midnight on a 24-hour clock (9 AM is 9, 4:30 PM is 16.5).`;

/**
 * Checks the request body the phone sent.
 * @returns {string|null} A problem to report, or null if the answers are usable.
 */
export function check_answers(body)
{
    const answers = body?.["answers"];
    if (typeof answers !== "object" || answers === null)
        return "Expected { answers: { steps, workers, times, arrivals, hours } }.";
    for (const key of ANSWER_KEYS)
    {
        if (typeof answers[key] !== "string")
            return `answers.${key} must be text.`;
        if (answers[key].length > MAX_ANSWER_LENGTH)
            return `answers.${key} is too long (at most ${MAX_ANSWER_LENGTH} characters).`;
    }
    if (answers["steps"].trim() === "")
        return "answers.steps is needed.";
    return null;
}

// the user message: each question with its answer
export function build_user_message(answers)
{
    return QUESTIONS.map((q, i) => `${i + 1}. ${q.text}\n${answers[q.key].trim() || "(no answer)"}`).join("\n\n");
}

const is_number = (v) => typeof v === "number" && Number.isFinite(v);
// a time of day in hours, or null if it isn't one
const time_or_null = (v) => is_number(v) && v >= 0 && v <= 24 ? v : null;

/**
 * Turns the model's extraction into the input schema (the format of runs/test-1/input_schema.json), with null for
 * anything unknown, plus the list of fields left null. The app stars null fields when it loads this (schema_to_form).
 *
 * @param {object} extraction - The model's answer, in EXTRACTION_SCHEMA's shape.
 * @returns {{schema: object, missing_fields: string[]}}
 */
export function extraction_to_schema(extraction)
{
    const missing = [];
    // records the field as missing when the value is null
    const track = (value, path) =>
    {
        if (value === null || value === undefined)
            missing.push(path);
        return value ?? null;
    };

    // no stations came back: the app starts every page blank (every other field depends on the stations)
    const stations_in = Array.isArray(extraction?.["stations"]) ? extraction["stations"] : [];
    if (stations_in.length === 0)
        return { schema: { "stations": null }, missing_fields: ["stations"] };

    const stations = stations_in.map((s, i) =>
    {
        const p = `stations[${i}]`;
        const customer_led = s?.["customer_led"] === true;
        const workers = customer_led ? 0 : (Number.isInteger(s?.["workers"]) && s["workers"] >= 1 ? s["workers"] : null);
        const minutes = is_number(s?.["minutes"]) && s["minutes"] > 0 ? s["minutes"] : null;
        const variance = s?.["variance"] in VARIANCE_RATIOS ? s["variance"] : null;
        // stddev comes from the variance level and the minutes, like Simple mode does; unknown if either is
        const stddev = minutes !== null && variance !== null ? VARIANCE_RATIOS[variance] * minutes : null;
        return {
            "id": i,
            "label": track(typeof s?.["name"] === "string" && s["name"].trim() !== "" ? s["name"].trim() : null, `${p}.label`),
            "workers": track(workers, `${p}.workers`),
            "service_time_minutes": {
                "distribution": "lognormal",
                "mean": track(minutes, `${p}.service_time_minutes.mean`),
                "stddev": track(stddev, `${p}.service_time_minutes.stddev`),
            },
        };
    });

    const type = extraction["arrival_type"] === "bursty" || extraction["arrival_type"] === "consistent" ? extraction["arrival_type"] : null;
    const per_hour = is_number(extraction["arrivals_per_hour"]) && extraction["arrivals_per_hour"] > 0 ? extraction["arrivals_per_hour"] : null;
    const arrival_pattern = { "type": track(type, "arrival_pattern.type"), "avg_arrivals_per_hour": track(per_hour, "arrival_pattern.avg_arrivals_per_hour") };
    // the peak and how much busier it is only matter for bursty arrivals
    if (type === "bursty")
    {
        const level = extraction["burst_level"] in BURST_FRACS ? extraction["burst_level"] : null;
        arrival_pattern["peak_time"] = track(time_or_null(extraction["peak_time"]), "arrival_pattern.peak_time");
        arrival_pattern["burst_frac"] = track(level === null ? null : BURST_FRACS[level], "arrival_pattern.burst_frac");
    }

    return {
        schema: {
            "stations": stations,
            "routing": "linear",
            "arrival_pattern": arrival_pattern,
            "operating_hours": {
                "open": track(time_or_null(extraction["open_time"]), "operating_hours.open"),
                "close": track(time_or_null(extraction["close_time"]), "operating_hours.close"),
            },
            // the app works out the total from the stations, and Simple mode uses its own simulation settings
            "constraints": { "max_total_workers": null },
            "simulation_settings": null,
        },
        missing_fields: missing,
    };
}
