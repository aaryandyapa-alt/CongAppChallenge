// The example run offered at the end of the tutorial ("Try a sample run"): a small food-bank setup whose current
// split is short-handed at Intake, so the results show a clear improvement. (It's the same setup as runs/test-2,
// which the Small developer preset also uses.)

import sample from "../../runs/test-2/input_schema.json";
import { list_runs } from "../storage.js";
import { check_run_name } from "./form_checks.js";

export const SAMPLE_SCHEMA = sample;
export const SAMPLE_NAME = "Sample run";

// "Sample run", or "Sample run 2", "Sample run 3"... if that name is taken
export function sample_name()
{
    const existing = list_runs();
    let name = SAMPLE_NAME;
    for (let n = 2; check_run_name(name, existing) !== null; n++)
        name = `${SAMPLE_NAME} ${n}`;
    return name;
}

/**
 * Practice spots, so a new user meets each warning color once with an explanation (draft action "begin_sample"):
 *   starred - fields marked ★ amber, as if the AI had guessed them
 *   blank   - fields left empty, so they show red until they're filled in
 *   hints   - a callout with an arrow above each of those fields (components/StarredField.js), shown until it's dealt with:
 *             an amber one until its star is cleared, a red one until its problem is fixed
 * Spread over the first three review pages (Basics, Arrivals, Station 1), so one shows up on the very first page.
 * Settings > Developer > Screenshot run loads the same practice spots without the hints, for taking screenshots.
 */
export const SAMPLE_PRACTICE = {
    starred: ["basics.open_time", "arrivals.burst_level", "stations.0.workers"],
    blank: ["arrivals.per_hour"],
    hints: {
        "basics.open_time": {
            kind: "amber",
            text: "★ Amber means this was a guess, so give it a look. If it's right, tap AM to confirm it; if not, type the right time.",
        },
        "arrivals.per_hour": {
            kind: "red",
            text: "Red means something needs fixing before you can simulate. This one's empty: type how many people come in per hour (this sample uses 25).",
        },
        "arrivals.burst_level": {
            kind: "amber",
            text: "★ Another guess. For lists like this, open it and pick an option, even the same one, to confirm it.",
        },
        "stations.0.workers": {
            kind: "amber",
            text: "★ Is 1 worker at Intake right? Retype the number to confirm it, or change it. (Keep it at 1 to see the biggest improvement.)",
        },
    },
};
