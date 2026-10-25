"use strict";

/**
 * Fixed wording for the results screens, filled in with the real numbers. Nothing here is written by AI.
 * Each scenario is one entry of output.json: { workers: [per station], metrics: { mean_wait, p90_wait, balance } }.
 */

// the order the results pages show the scenarios in
export const SCENARIOS = ["current", "mean_wait", "p90_wait", "balance"];

export const TITLES = {
    "current": "Your current setup",
    "mean_wait": "Shortest average wait",
    "p90_wait": "Shortest long waits",
    "balance": "Most even workload",
};

// minutes -> "under 1 min", "4.2 min", "38 min" or "1 hr 12 min"
export function format_minutes(minutes)
{
    if (minutes < 0.05)
        return "under 0.1 min";
    if (minutes < 10)
        return `${minutes.toFixed(1)} min`;
    if (minutes < 60)
        return `${Math.round(minutes)} min`;
    const whole = Math.round(minutes);
    const hours = Math.floor(whole / 60);
    const rest = whole % 60;
    return rest === 0 ? `${hours} hr` : `${hours} hr ${rest} min`;
}

// balance is a spread of how busy each station is (0 to 1); shown as a percentage, lower is more even
export function format_balance(balance)
{
    const percent = balance * 100;
    if (percent < 0.5)
        return "under 1%";
    return `${Math.round(percent)}%`;
}

// the three measures for any scenario: a label, the formatted value, and both as one line
export function measures(metrics)
{
    const mean = format_minutes(metrics["mean_wait"]);
    const p90 = format_minutes(metrics["p90_wait"]);
    const balance = format_balance(metrics["balance"]);
    return {
        "mean_wait": { label: "Average wait", value: mean, line: `Average wait: ${mean}` },
        "p90_wait": { label: "9 in 10 people wait less than", value: p90, line: `9 in 10 people wait less than ${p90}` },
        "balance": { label: "Workload difference", value: balance, line: `Workload difference: ${balance}` },
    };
}

export const BALANCE_EXPLAINED = "Workload difference is how unevenly busy the staffed stations are. Lower means the work is spread more evenly.";

// "down from 6.8 min", "up from 2%", or "same as now", comparing a scenario's measure with the current setup's
export function compared_with_current(key, value, current_value)
{
    const format = key === "balance" ? format_balance : format_minutes;
    if (format(value) === format(current_value))
        return "same as now";
    return `${value < current_value ? "down" : "up"} from ${format(current_value)}`;
}

/**
 * The plain-English sentence under a scenario's numbers.
 *
 * @param {string} key - "current", "mean_wait", "p90_wait" or "balance".
 * @param {object} scenario - This scenario from output.json.
 * @param {object} current - The "current" scenario from output.json.
 */
export function scenario_sentence(key, scenario, current)
{
    const m = scenario["metrics"];
    const c = current["metrics"];
    const same_split = key !== "current" && scenario["workers"].every((w, i) => w === current["workers"][i]);

    if (key === "current")
        return `With your current setup, people wait about ${format_minutes(m["mean_wait"])} on average, and 1 in 10 wait longer than ${format_minutes(m["p90_wait"])}.`;

    if (key === "mean_wait")
    {
        if (same_split)
            return "Your current setup already gives the shortest average wait we found.";
        return `Moving workers as shown changes the average wait from ${format_minutes(c["mean_wait"])} to ${format_minutes(m["mean_wait"])}.`;
    }

    if (key === "p90_wait")
    {
        if (same_split)
            return "Your current setup already keeps the longest waits as short as anything we found.";
        return `Moving workers as shown means 9 in 10 people wait less than ${format_minutes(m["p90_wait"])}, instead of ${format_minutes(c["p90_wait"])}.`;
    }

    if (same_split)
        return "Your current setup already spreads the work most evenly of any setup we found.";
    return `Moving workers as shown spreads the work more evenly: a ${format_balance(m["balance"])} workload difference, instead of ${format_balance(c["balance"])}.`;
}
