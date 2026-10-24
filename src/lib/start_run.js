"use strict";

// the only file in the app that imports the engine
import convert_check_schema from "../convert_check_schema.js";
import run_optimizer from "../optimization.js";
import { save_input, save_output, save_info } from "../storage.js";
import { form_to_schema } from "./form_to_schema.js";

/**
 * Simulates a finished draft run, then saves it. Nothing is written until the simulation is done.
 *
 * @param {string} name - The run's name, which is also its folder name.
 * @param {string} mode - "simple" or "pro".
 * @param {object} form - The draft's form; check_form must find no problems in it.
 * @returns {Promise<object>} The run_optimizer result, as saved in output.json.
 * @throws {Error} From convert_check_schema, if the schema is invalid.
 */
export default async function start_run(name, mode, form)
{
    const schema = form_to_schema(form, mode);
    const output = run_optimizer(convert_check_schema(schema));

    await save_input(name, schema);
    await save_output(name, output);
    await save_info(name, { "name": name, "mode": mode, "date_run": new Date().toISOString() });
    return output;
}
