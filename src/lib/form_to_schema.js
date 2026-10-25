"use strict";

/**
 * Converts between the review screens' form and the input schema (the format of runs/test-1/input_schema.json).
 *
 * Form shape:
 * {
 *   basics:   { open_time, close_time, station_count },                  // times are minutes after midnight
 *   arrivals: { type, per_hour, peak_time, burst_level, burst_frac },    // type is "consistent" or "bursty"
 *   stations: [{ name, customer_led, workers, minutes, variance_level, distribution, stddev }],
 *   sim:      { replications, seed },
 * }
 * Blank fields are null. Levels are "low", "medium" or "high".
 * Simple mode uses the levels; Pro mode (shown to users as "Advanced") uses burst_frac, distribution, stddev and sim instead.
 * There's no total-workers field: the total is always the sum of the stations' workers (see total_workers below).
 * stations can hold more entries than station_count: the extras are removed stations, kept so their values come back if the user re-adds them.
 */

// variance level -> stddev as a fraction of the mean
export const VARIANCE_RATIOS = { "low": 0.15, "medium": 0.4, "high": 0.8 };
// burst level -> burst_frac
export const BURST_FRACS = { "low": 0.25, "medium": 0.5, "high": 0.8 };

export const DEFAULT_REPLICATIONS = 50;
export const DEFAULT_SEED = 42;

// used in place of fields the AI couldn't fill; those fields get starred
const DEFAULTS = {
    "open_time": 9 * 60,
    "close_time": 17 * 60,
    "per_hour": 20,
    "arrival_type": "consistent",
    "burst_level": "medium",
    "workers": 1,
    "minutes": 5,
    "variance_level": "medium",
};

export function blank_station()
{
    return { name: "", customer_led: false, workers: null, minutes: null, variance_level: null, distribution: "lognormal", stddev: null };
}

export function blank_form()
{
    return {
        basics: { open_time: null, close_time: null, station_count: null },
        arrivals: { type: null, per_hour: null, peak_time: null, burst_level: null, burst_frac: null },
        stations: [],
        sim: { replications: DEFAULT_REPLICATIONS, seed: DEFAULT_SEED },
    };
}

/**
 * The total number of workers: the sum over the stations that are shown (customer-led ones have none).
 * null if any staffed station's workers are still blank.
 */
export function total_workers(form)
{
    let total = 0;
    for (const s of form.stations.slice(0, form.basics.station_count ?? 0))
    {
        if (s.customer_led)
            continue;
        if (!Number.isInteger(s.workers))
            return null;
        total += s.workers;
    }
    return total;
}

/**
 * Builds the input schema from the form. Only call this once check_form finds no problems.
 *
 * @param {object} form - The form, in the shape described at the top of this file.
 * @param {string} mode - "simple" or "pro".
 * @returns {object} The input schema.
 */
export function form_to_schema(form, mode)
{
    const simple = mode === "simple";
    const a = form.arrivals;

    // stations past station_count were removed by the user
    const stations = form.stations.slice(0, form.basics.station_count).map((s, i) =>
    {
        const distribution = simple ? "lognormal" : s.distribution;
        const time = { "distribution": distribution, "mean": s.minutes };
        // exponential has no stddev
        if (distribution === "lognormal")
            time["stddev"] = simple ? VARIANCE_RATIOS[s.variance_level] * s.minutes : s.stddev;
        return { "id": i, "label": s.name.trim(), "workers": s.customer_led ? 0 : s.workers, "service_time_minutes": time };
    });

    const arrival_pattern = { "type": a.type, "avg_arrivals_per_hour": a.per_hour };
    // peak_time and burst_frac only shape bursty arrivals
    if (a.type === "bursty")
    {
        arrival_pattern["peak_time"] = a.peak_time / 60;
        arrival_pattern["burst_frac"] = simple ? BURST_FRACS[a.burst_level] : a.burst_frac;
    }

    return {
        "stations": stations,
        "routing": "linear",
        "arrival_pattern": arrival_pattern,
        "operating_hours": { "open": form.basics.open_time / 60, "close": form.basics.close_time / 60 },
        "constraints": { "max_total_workers": total_workers(form) },
        "simulation_settings": simple
            ? { "num_replications": DEFAULT_REPLICATIONS, "random_seed": DEFAULT_SEED }
            : { "num_replications": form.sim.replications, "random_seed": form.sim.seed },
    };
}

// the level whose value is closest to v
function nearest_level(v, levels)
{
    let best = null;
    for (const [level, value] of Object.entries(levels))
    {
        if (best === null || Math.abs(v - value) < Math.abs(v - levels[best]))
            best = level;
    }
    return best;
}

const is_blank = (v) => v === null || v === undefined;

/**
 * Builds a form from an input schema: an AI result, or a saved run being duplicated.
 * Any field that is null or missing gets a default value and is starred.
 *
 * @param {object} schema - An input schema. Fields may be null.
 * @returns {object|null} { form, starred }, where starred maps form paths like "stations.1.minutes" to true.
 *     null if no stations came back, since every other field depends on that list.
 */
export function schema_to_form(schema)
{
    const stations_in = schema?.["stations"];
    if (!Array.isArray(stations_in) || stations_in.length === 0)
        return null;

    const starred = {};
    // returns v, or the fallback (and stars the field) if v is blank
    const fill = (v, path, fallback) =>
    {
        if (!is_blank(v))
            return v;
        starred[path] = true;
        return fallback;
    };
    // times of day in hours -> minutes after midnight
    const to_minutes = (h) => is_blank(h) ? h : Math.round(h * 60);

    const form = blank_form();

    // stations are listed in id order, which is the order customers visit them
    const sorted = [...stations_in].sort((x, y) => (x?.["id"] ?? 0) - (y?.["id"] ?? 0));
    form.stations = sorted.map((s, i) =>
    {
        const p = `stations.${i}.`;
        const t = s?.["service_time_minutes"] ?? {};
        const customer_led = s?.["workers"] === 0;
        const minutes = fill(t["mean"], p + "minutes", DEFAULTS["minutes"]);
        const distribution = t["distribution"] === "exponential" ? "exponential" : "lognormal";

        // exponential's spread is fixed: its stddev equals its mean
        let stddev = distribution === "exponential" ? minutes : t["stddev"];
        let variance_level;
        if (is_blank(stddev))
        {
            variance_level = fill(null, p + "variance_level", DEFAULTS["variance_level"]);
            stddev = VARIANCE_RATIOS[variance_level] * minutes;
        }
        else
            variance_level = nearest_level(stddev / minutes, VARIANCE_RATIOS);

        return {
            name: fill(s?.["label"] || null, p + "name", `Station ${i + 1}`),
            customer_led: customer_led,
            workers: customer_led ? null : fill(s?.["workers"], p + "workers", DEFAULTS["workers"]),
            minutes: minutes,
            variance_level: variance_level,
            distribution: distribution,
            stddev: distribution === "lognormal" ? stddev : null,
        };
    });

    const hours = schema["operating_hours"] ?? {};
    const open_time = fill(to_minutes(hours["open"]), "basics.open_time", DEFAULTS["open_time"]);
    const close_time = fill(to_minutes(hours["close"]), "basics.close_time", DEFAULTS["close_time"]);
    // constraints.max_total_workers isn't read: the total is worked out from the stations
    form.basics = { open_time: open_time, close_time: close_time, station_count: form.stations.length };

    const a = schema["arrival_pattern"] ?? {};
    const type = fill(a["type"], "arrivals.type", DEFAULTS["arrival_type"]);
    form.arrivals.type = type;
    form.arrivals.per_hour = fill(a["avg_arrivals_per_hour"], "arrivals.per_hour", DEFAULTS["per_hour"]);
    if (type === "bursty")
    {
        // default peak: halfway through the day, to the nearest 15 minutes
        const midday = Math.round((open_time + close_time) / 2 / 15) * 15;
        form.arrivals.peak_time = fill(to_minutes(a["peak_time"]), "arrivals.peak_time", midday);
        if (is_blank(a["burst_frac"]))
        {
            form.arrivals.burst_level = fill(null, "arrivals.burst_level", DEFAULTS["burst_level"]);
            form.arrivals.burst_frac = BURST_FRACS[form.arrivals.burst_level];
        }
        else
        {
            form.arrivals.burst_frac = a["burst_frac"];
            form.arrivals.burst_level = nearest_level(a["burst_frac"], BURST_FRACS);
        }
    }

    // never starred: Simple mode doesn't show these
    const settings = schema["simulation_settings"] ?? {};
    form.sim = {
        replications: settings["num_replications"] ?? DEFAULT_REPLICATIONS,
        seed: settings["random_seed"] ?? DEFAULT_SEED,
    };

    return { form: form, starred: starred };
}
