"use strict";

// the only file in the app that imports the engine
import convert_check_schema from "../convert_check_schema.js";
import { run_optimizer_steps } from "../optimization.js";
import { save_input, save_output, save_info } from "../storage.js";
import { form_to_schema } from "./form_to_schema.js";

// how long to keep simulating before letting the screen redraw
const BURST_MS = 100;

/**
 * Simulates a finished draft run, then saves it. Nothing is written until the simulation is done.
 * The optimizer runs in short bursts with a pause between them, so the screen can show progress.
 *
 * @param {string} name - The run's name, which is also its folder name.
 * @param {string} mode - "simple" or "pro".
 * @param {object} form - The draft's form; check_form must find no problems in it.
 * @param {Function} on_progress - Optional. Called between bursts with
 *     { fraction, stage, alloc, staffed_ids, split, splits } (see run_optimizer_steps in optimization.js);
 *     fraction is 0 to 1 and never goes backwards.
 * @returns {Promise<object>} The run_optimizer result, as saved in output.json.
 * @throws {Error} From convert_check_schema, if the schema is invalid.
 */
export default async function start_run(name, mode, form, on_progress)
{
    const schema = form_to_schema(form, mode);
    const steps = run_optimizer_steps(convert_check_schema(schema));
    // how long the simulation itself takes (not the saving), kept in run_info.json for Settings > Developer > Show timings
    const started_at = Date.now();

    let shown = 0;
    let step = steps.next();
    while (!step.done)
    {
        // simulate for a little while...
        const until = Date.now() + BURST_MS;
        while (!step.done && Date.now() < until)
            step = steps.next();

        // ...then report how far along it is and let the screen redraw
        if (!step.done)
        {
            const p = step.value;
            // the estimate can grow, so keep the bar from going backwards; 100% only once it's really finished
            shown = Math.max(shown, Math.min(0.99, p.done / p.estimate));
            on_progress?.({ fraction: shown, stage: p.stage, alloc: [...p.alloc], staffed_ids: p.staffed_ids, split: p.split, splits: p.splits });
            await new Promise((resolve) => setTimeout(resolve, 0));
        }
    }
    const output = step.value;
    const simulation_seconds = (Date.now() - started_at) / 1000;
    on_progress?.({ fraction: 1, stage: "saving", alloc: null, staffed_ids: [], split: 0, splits: 0 });

    await save_input(name, schema);
    await save_output(name, output);
    await save_info(name, { "name": name, "mode": mode, "date_run": new Date().toISOString(), "simulation_seconds": simulation_seconds });
    return output;
}
