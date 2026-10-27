// Settings > Developer > Add example runs: realistic, made-up runs for screenshots of Home (and of the saved-run
// and results screens behind them). Each is a small, believable setup that matches its name, and is simulated for
// real when added, so opening one shows genuine results. None is overloaded, and each current split leaves room to improve.

import { BURST_FRACS, VARIANCE_RATIOS } from "./form_to_schema.js";

// [label, workers, average minutes, variance level ("low" / "medium" / "high")]; Advanced runs give the stddev instead
function make_schema({ open, close, per_hour, peak = null, burst = null, stations, advanced = false })
{
    const bursty = peak !== null;
    const arrival_pattern = { "type": bursty ? "bursty" : "consistent", "avg_arrivals_per_hour": per_hour };
    if (bursty)
    {
        arrival_pattern["peak_time"] = peak;
        arrival_pattern["burst_frac"] = advanced ? burst : BURST_FRACS[burst];
    }
    return {
        "stations": stations.map(([label, workers, minutes, spread], id) => ({
            "id": id,
            "label": label,
            "workers": workers,
            // Simple runs use the same spreads as Simple mode's levels, so they read back as those levels
            "service_time_minutes": { "distribution": "lognormal", "mean": minutes, "stddev": advanced ? spread : VARIANCE_RATIOS[spread] * minutes },
        })),
        "routing": "linear",
        "arrival_pattern": arrival_pattern,
        "operating_hours": { "open": open, "close": close },
        "constraints": { "max_total_workers": stations.reduce((sum, s) => sum + s[1], 0) },
        "simulation_settings": { "num_replications": 50, "random_seed": 42 },
    };
}

/**
 * The example runs, newest first: name, mode ("simple" or "pro" for Advanced), when it was "run"
 * (days ago, at an hour of the day), and its setup.
 */
export const EXAMPLE_RUNS = [
    {
        name: "Saturday pantry", mode: "simple", days_ago: 1, hour: 11.6,
        schema: make_schema({
            open: 9, close: 13, per_hour: 20, peak: 10.5, burst: "medium",
            stations: [["Check-in", 1, 2, "low"], ["Groceries", 3, 5, "medium"], ["Produce", 1, 4, "medium"]],
        }),
    },
    {
        name: "Tuesday mobile pantry", mode: "simple", days_ago: 4, hour: 16.25,
        schema: make_schema({
            open: 15, close: 18, per_hour: 34,
            stations: [["Registration", 3, 1.5, "low"], ["Box pickup", 2, 3.2, "medium"]],
        }),
    },
    {
        name: "Free clinic evening hours", mode: "pro", days_ago: 6, hour: 20.1,
        schema: make_schema({
            open: 17, close: 21, per_hour: 7, advanced: true,
            stations: [["Front desk", 2, 4, 1.5], ["Triage", 1, 8, 3], ["Doctor visit", 2, 15, 6]],
        }),
    },
    {
        name: "Senior box day", mode: "simple", days_ago: 9, hour: 9.75,
        schema: make_schema({
            open: 9, close: 12, per_hour: 20, peak: 10, burst: "low",
            stations: [["Sign-in", 1, 2, "low"], ["Box pickup", 3, 3, "low"], ["Carry-out help", 1, 6, "high"]],
        }),
    },
    {
        name: "Back-to-school drive", mode: "simple", days_ago: 13, hour: 15.4,
        schema: make_schema({
            open: 12, close: 17, per_hour: 18, peak: 14, burst: "medium",
            stations: [["Check-in", 2, 3, "low"], ["Backpacks", 2, 4, "medium"], ["School supplies", 1, 5, "medium"]],
        }),
    },
    {
        name: "Thanksgiving turkey giveaway", mode: "simple", days_ago: 19, hour: 10.3,
        schema: make_schema({
            open: 9, close: 13, per_hour: 30, peak: 11, burst: "medium",
            stations: [["Registration", 2, 2, "low"], ["Turkey pickup", 2, 3, "medium"], ["Sides table", 1, 2.5, "medium"]],
        }),
    },
    {
        name: "Wednesday produce market", mode: "simple", days_ago: 23, hour: 17.2,
        schema: make_schema({
            open: 15, close: 18, per_hour: 25,
            stations: [["Welcome table", 2, 1.5, "low"], ["Produce stand", 2, 5, "high"]],
        }),
    },
];

// when an example was "run": days_ago days before now, at its hour of the day
export function example_date(run, now = new Date())
{
    const date = new Date(now);
    date.setDate(date.getDate() - run.days_ago);
    date.setHours(Math.floor(run.hour), Math.round((run.hour % 1) * 60), 0, 0);
    return date.toISOString();
}
