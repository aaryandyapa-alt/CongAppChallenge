"use strict";

/**
 * Validates the raw input schema and converts it into the form the simulation engine uses.
 * All times are converted to minutes. Values are never rounded, so decimals pass through as-is.
 * operating_hours.open, operating_hours.close and arrival_pattern.peak_time are times of day in hours,
 * in [0, 24] (e.g. 10.5 is 10:30). In the output they become minutes after opening.
 * The input object is not modified.
 *
 * Output shape:
 * {
 *   stations: [{ id, label, workers, service_time: { distribution, mean, stddev } }],  // sorted by id, the 0-indexed position in the flow
 *   arrival_pattern: { type, avg_arrivals_per_min, peak_min, burst_frac },  // type is "bursty" or "consistent"; peak_min and burst_frac are NaN for "consistent"
 *   operating_mins,
 *   total_workers,
 *   simulation_settings: { num_replications, random_seed }
 * }
 *
 * @param {object} schema - The input schema, as read from input_schema.json.
 * @returns {object} The converted schema.
 * @throws {Error} Listing every problem found, if the schema is invalid.
 */
export default function convert_check_schema(schema)
{
    const errors = [];

    const is_num = (v) => typeof v === "number" && Number.isFinite(v);
    const check_num = (v, name, cond, cond_text) =>
    {
        if (!is_num(v))
            errors.push(`${name} must be a finite number (got ${JSON.stringify(v)})`);
        else if (!cond(v))
            errors.push(`${name} must be ${cond_text} (got ${v})`);
    };
    const positive = (v) => v > 0;
    const positive_int = (v) => Number.isInteger(v) && v > 0;
    const non_negative_int = (v) => Number.isInteger(v) && v >= 0;

    if (typeof schema !== "object" || schema === null)
        throw new TypeError("schema must be an object");

    const stations_in = Array.isArray(schema["stations"]) ? schema["stations"] : [];
    const routing = schema["routing"];
    const arrivals = schema["arrival_pattern"] ?? {};
    const settings = schema["simulation_settings"] ?? {};
    const constraints = schema["constraints"] ?? {};

    // operating hours, as times of day in hours (e.g. 10.5 is 10:30)
    const hours_in = schema["operating_hours"];
    const is_hours_obj = typeof hours_in === "object" && hours_in !== null && !Array.isArray(hours_in);
    if (!is_hours_obj)
        errors.push(`operating_hours must be an object like { "open": 10, "close": 14 } (got ${JSON.stringify(hours_in)})`);
    const open = is_hours_obj ? hours_in["open"] : undefined;
    const close = is_hours_obj ? hours_in["close"] : undefined;
    const time_of_day = (v) => v >= 0 && v <= 24;
    if (is_hours_obj)
    {
        check_num(open, "operating_hours.open", time_of_day, "in [0, 24]");
        check_num(close, "operating_hours.close", time_of_day, "in [0, 24]");
    }
    const hours_in_range = is_num(open) && is_num(close) && time_of_day(open) && time_of_day(close);
    if (hours_in_range && close <= open)
        errors.push(`operating_hours.close must be after operating_hours.open (got open ${open}, close ${close})`);
    // true only if open and close are both usable, so the peak_time check can rely on them
    const hours_ok = hours_in_range && close > open;

    // arrival pattern
    const is_bursty = arrivals["type"] === "bursty";
    if (!is_bursty && arrivals["type"] !== "consistent")
        errors.push(`arrival_pattern.type must be "bursty" or "consistent" (got ${JSON.stringify(arrivals["type"])})`);
    check_num(arrivals["avg_arrivals_per_hour"], "arrival_pattern.avg_arrivals_per_hour", positive, "> 0");
    // peak_time and burst_frac only shape bursty arrivals
    if (is_bursty)
    {
        check_num(arrivals["burst_frac"], "arrival_pattern.burst_frac", (v) => v >= 0 && v <= 1, "in [0, 1]");
        check_num(arrivals["peak_time"], "arrival_pattern.peak_time",
            (v) => time_of_day(v) && (!hours_ok || (v >= open && v <= close)),
            hours_ok ? `in [${open}, ${close}] (between operating_hours.open and close)` : "in [0, 24]");
    }

    // stations
    if (stations_in.length === 0)
        errors.push("stations must be a non-empty array");

    // id is the station's 0-indexed position in the flow
    const stations_by_id = {};
    for (let i=0; i<stations_in.length; i++)
    {
        const s = stations_in[i] ?? {};
        const name = `stations[${i}]`;
        if (!Number.isInteger(s["id"]) || s["id"] < 0)
            errors.push(`${name}.id must be a non-negative integer (got ${JSON.stringify(s["id"])})`);
        else if (s["id"] in stations_by_id)
            errors.push(`${name}.id ${s["id"]} is used by more than one station`);
        else
            stations_by_id[s["id"]] = s;

        check_num(s["workers"], `${name}.workers`, non_negative_int, "a non-negative integer");

        const t = s["service_time_minutes"] ?? {};
        check_num(t["mean"], `${name}.service_time_minutes.mean`, positive, "> 0");
        if (t["distribution"] === "lognormal")
            check_num(t["stddev"], `${name}.service_time_minutes.stddev`, (v) => v >= 0, ">= 0");
        else if (t["distribution"] !== "exponential")
            errors.push(`${name}.service_time_minutes.distribution must be "exponential" or "lognormal" (got ${JSON.stringify(t["distribution"])})`);
    }

    // ids must be exactly 0, 1, ..., n-1
    const missing = [];
    for (let id=0; id<stations_in.length; id++)
    {
        if (!(id in stations_by_id))
            missing.push(id);
    }
    if (missing.length !== 0)
        errors.push(`station ids must count up from 0 with no gaps or repeats (missing ${missing.join(", ")})`);
    for (const id in stations_by_id)
    {
        if (Number(id) >= stations_in.length)
            errors.push(`station id ${id} is too large; with ${stations_in.length} stations, ids must be 0 to ${stations_in.length - 1}`);
    }

    // routing
    if (routing !== "linear")
        errors.push(`routing must be "linear" (got ${JSON.stringify(routing)})`);

    // workers
    const max_total_workers = constraints["max_total_workers"];
    check_num(max_total_workers, "constraints.max_total_workers", non_negative_int, "a non-negative integer");
    const worker_sum = stations_in.reduce((sum, s) => sum + (s?.["workers"] ?? 0), 0);
    if (is_num(max_total_workers) && is_num(worker_sum) && worker_sum !== max_total_workers)
        errors.push(`station workers add up to ${worker_sum}, but constraints.max_total_workers is ${max_total_workers}`);

    // simulation settings
    check_num(settings["num_replications"], "simulation_settings.num_replications", positive_int, "a positive integer");
    check_num(settings["random_seed"], "simulation_settings.random_seed", Number.isInteger, "an integer");

    if (errors.length !== 0)
        throw new Error("Invalid input schema:\n  - " + errors.join("\n  - "));

    // times of day, converted from hours to minutes
    const open_min = open * 60;
    const close_min = close * 60;

    // build the converted schema
    const stations = stations_in.map((_, id) =>
    {
        const s = stations_by_id[id];
        const t = s["service_time_minutes"];
        return {
            "id": id,
            "label": s["label"] ?? `station ${id}`,
            "workers": s["workers"],
            "service_time": { "distribution": t["distribution"], "mean": t["mean"], "stddev": t["stddev"] },
        };
    });

    return {
        "stations": stations,
        "arrival_pattern": {
            "type": arrivals["type"],
            "avg_arrivals_per_min": arrivals["avg_arrivals_per_hour"] / 60,
            // minutes after opening; not used by consistent arrivals
            "peak_min": is_bursty ? arrivals["peak_time"] * 60 - open_min : NaN,
            "burst_frac": is_bursty ? arrivals["burst_frac"] : NaN,
        },
        "operating_mins": close_min - open_min,
        "total_workers": max_total_workers,
        "simulation_settings": {
            "num_replications": settings["num_replications"],
            "random_seed": settings["random_seed"],
        },
    };
}
