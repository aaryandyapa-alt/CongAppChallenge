"use strict";

import { blank_station } from "./form_to_schema.js";

/**
 * Checks run while the user types, with messages for the review screens.
 * convert_check_schema still checks the final schema before simulating; these are the friendly versions.
 */

const is_blank = (v) => v === null || v === undefined || Number.isNaN(v);
const is_whole = (v) => Number.isInteger(v);

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
    if (is_blank(b.open_time))
        errors["basics.open_time"] = "Enter an opening time.";
    if (is_blank(b.close_time))
        errors["basics.close_time"] = "Enter a closing time.";
    const hours_ok = !is_blank(b.open_time) && !is_blank(b.close_time) && b.close_time > b.open_time;
    if (!is_blank(b.open_time) && !is_blank(b.close_time) && !hours_ok)
        errors["basics.close_time"] = "Closing time must be after opening time.";

    if (is_blank(b.total_workers))
        errors["basics.total_workers"] = "Enter the total number of workers.";
    else if (!is_whole(b.total_workers) || b.total_workers < 0)
        errors["basics.total_workers"] = "Total workers must be a whole number.";

    if (is_blank(b.station_count))
        errors["basics.station_count"] = "Enter the number of stations.";
    else if (!is_whole(b.station_count) || b.station_count < 1)
        errors["basics.station_count"] = "There must be at least 1 station.";

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
        if (is_blank(a.peak_time))
            errors["arrivals.peak_time"] = "Enter the busiest time of day.";
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
    const count = is_whole(b.station_count) && b.station_count > 0 ? b.station_count : 0;
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
 * @param {string} name - The name the user typed.
 * @param {string[]} existing_names - Names of the saved runs, from storage.list_runs().
 * @returns {string|null} A message if the name can't be used, or null if it's fine.
 */
export function check_run_name(name, existing_names)
{
    if (!name || name.trim() === "")
        return "Enter a name for this run.";
    if (FORBIDDEN_CHARS.test(name))
        return "Names can't contain any of these: / \\ : * ? \" < > |";
    if (name !== name.trim() || name.startsWith(".") || name.endsWith("."))
        return "Names can't start or end with a space or a dot.";
    // some phones treat "Test" and "test" as the same folder
    if (existing_names.some((n) => n.toLowerCase() === name.toLowerCase()))
        return "A run with this name already exists.";
    return null;
}
