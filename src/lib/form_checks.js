"use strict";

import { blank_station } from "./form_to_schema.js";

/**
 * Checks run while the user types, with messages for the review screens.
 * convert_check_schema still checks the final schema before simulating; these are the friendly versions.
 */

export const MAX_STATIONS = 20;

const is_blank = (v) => v === null || v === undefined || Number.isNaN(v);
const is_whole = (v) => Number.isInteger(v);

// TimeInput reports null when it's empty, and NaN when something is typed but isn't a real time
function time_error(v, blank_message)
{
    if (v === null || v === undefined)
        return blank_message;
    if (Number.isNaN(v))
        return "That isn't a real time. Use an hour from 1 to 12 and minutes from 0 to 59.";
    return null;
}

/**
 * @param {object} form - The form, in the shape described in form_to_schema.js.
 * @param {string} mode - "simple" or "pro".
 * @returns {object} Problems found, mapping form paths like "stations.1.minutes" to a message. Empty if there are none.
 */
export function check_form(form, mode)
{
    const errors = {};
    const simple = mode === "simple";
    const b = form.basics;
    const a = form.arrivals;

    // establishment basics
    const open_error = time_error(b.open_time, "Enter an opening time.");
    const close_error = time_error(b.close_time, "Enter a closing time.");
    if (open_error)
        errors["basics.open_time"] = open_error;
    if (close_error)
        errors["basics.close_time"] = close_error;
    const hours_ok = !open_error && !close_error && b.close_time > b.open_time;
    if (!open_error && !close_error && !hours_ok)
        errors["basics.close_time"] = "Closing time must be after opening time.";

    if (is_blank(b.total_workers))
        errors["basics.total_workers"] = "Enter the total number of workers.";
    else if (!is_whole(b.total_workers) || b.total_workers < 0)
        errors["basics.total_workers"] = "Total workers must be a whole number.";

    if (is_blank(b.station_count))
        errors["basics.station_count"] = "Enter the number of stations.";
    else if (!is_whole(b.station_count) || b.station_count < 1)
        errors["basics.station_count"] = "There must be at least 1 station.";
    else if (b.station_count > MAX_STATIONS)
        errors["basics.station_count"] = `There can be at most ${MAX_STATIONS} stations.`;

    // arrivals
    if (is_blank(a.type))
        errors["arrivals.type"] = "Choose how people arrive.";
    if (is_blank(a.per_hour))
        errors["arrivals.per_hour"] = "Enter about how many people come in per hour.";
    else if (a.per_hour <= 0)
        errors["arrivals.per_hour"] = "People per hour must be more than 0.";

    // the peak and how strong it is only matter for bursts
    if (a.type === "bursty")
    {
        const peak_error = time_error(a.peak_time, "Enter the busiest time of day.");
        if (peak_error)
            errors["arrivals.peak_time"] = peak_error;
        else if (hours_ok && (a.peak_time < b.open_time || a.peak_time > b.close_time))
            errors["arrivals.peak_time"] = "The busiest time must be between opening and closing.";

        if (simple && is_blank(a.burst_level))
            errors["arrivals.burst_level"] = "Choose how much busier the busiest time is.";
        if (!simple)
        {
            if (is_blank(a.burst_frac))
                errors["arrivals.burst_frac"] = "Enter burst_frac.";
            else if (a.burst_frac < 0 || a.burst_frac > 1)
                errors["arrivals.burst_frac"] = "burst_frac must be between 0 and 1.";
        }
    }

    // stations; ones past station_count were removed and aren't checked
    const count = errors["basics.station_count"] ? 0 : b.station_count;
    let worker_sum = 0;
    let workers_ok = true;
    for (let i=0; i<count; i++)
    {
        const s = form.stations[i] ?? blank_station();
        const p = `stations.${i}.`;

        if (!s.name || s.name.trim() === "")
            errors[p + "name"] = "Enter a name for this station.";

        // customer-led stations have no workers
        if (!s.customer_led)
        {
            if (is_blank(s.workers))
                errors[p + "workers"] = "Enter the number of workers.";
            else if (!is_whole(s.workers) || s.workers < 1)
                errors[p + "workers"] = "A staffed station needs at least 1 worker (a whole number).";
            if (errors[p + "workers"])
                workers_ok = false;
            else
                worker_sum += s.workers;
        }

        if (is_blank(s.minutes))
            errors[p + "minutes"] = "Enter about how many minutes each person spends here.";
        else if (s.minutes <= 0)
            errors[p + "minutes"] = "Minutes must be more than 0.";

        if (simple && is_blank(s.variance_level))
            errors[p + "variance_level"] = "Choose how much the time varies.";
        if (!simple)
        {
            if (s.distribution !== "lognormal" && s.distribution !== "exponential")
                errors[p + "distribution"] = "Choose a distribution.";
            else if (s.distribution === "lognormal")
            {
                if (is_blank(s.stddev))
                    errors[p + "stddev"] = "Enter stddev.";
                else if (s.stddev < 0)
                    errors[p + "stddev"] = "stddev can't be negative.";
            }
        }
    }

    // the total on Establishment Basics must match the stations
    if (!errors["basics.total_workers"] && !errors["basics.station_count"] && workers_ok && worker_sum !== b.total_workers)
        errors["basics.total_workers"] = `The stations have ${worker_sum} workers in total, but total workers is ${b.total_workers}.`;

    // Pro only; Simple uses fixed settings
    if (!simple)
    {
        if (is_blank(form.sim.replications) || !is_whole(form.sim.replications) || form.sim.replications < 1)
            errors["sim.replications"] = "num_replications must be a whole number of at least 1.";
        if (is_blank(form.sim.seed) || !is_whole(form.sim.seed))
            errors["sim.seed"] = "random_seed must be a whole number.";
    }

    return errors;
}

/**
 * True if any problem is on the page whose fields start with prefix, like "basics." or "stations.2.".
 */
export function has_errors(errors, prefix)
{
    return Object.keys(errors).some((path) => path.startsWith(prefix));
}

// characters that aren't allowed in folder names
const FORBIDDEN_CHARS = /[/\\:*?"<>|]/;

/**
 * Spaces at the start and end are ignored (phone keyboards often add one), so the run must be saved as name.trim().
 *
 * @param {string} name - The name the user typed.
 * @param {string[]} existing_names - Names of the saved runs, from storage.list_runs().
 * @returns {string|null} A message if the name can't be used, or null if it's fine.
 */
export function check_run_name(name, existing_names)
{
    name = (name ?? "").trim();
    if (name === "")
        return "Enter a name for this run.";
    if (FORBIDDEN_CHARS.test(name))
        return "Names can't contain any of these: / \\ : * ? \" < > |";
    if (name.startsWith(".") || name.endsWith("."))
        return "Names can't start or end with a dot.";
    // some phones treat "Test" and "test" as the same folder
    if (existing_names.some((n) => n.toLowerCase() === name.toLowerCase()))
        return "A run with this name already exists.";
    return null;
}
