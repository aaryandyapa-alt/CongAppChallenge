"use strict";

import { File, Directory, Paths } from "expo-file-system";

// each run is stored like the runs/ folder in the repo:
//   <document dir>/runs/<run name>/input_schema.json   (the raw schema, before convert_check_schema)
//   <document dir>/runs/<run name>/output.json         (the result of run_optimizer)
//   <document dir>/runs/<run name>/run_info.json       (name, mode and when it was run)
// made on first use, not when this file loads: the web/server build (EAS Hosting, for the AI route) loads every
// screen's files without a phone file system, and touching Paths there would crash it
function runs_dir()
{
    return new Directory(Paths.document, "runs");
}

function run_dir(name)
{
    return new Directory(runs_dir(), name);
}

async function write_json(dir, filename, obj)
{
    const runs = runs_dir();
    if (!runs.exists)
        runs.create();
    if (!dir.exists)
        dir.create();

    const file = new File(dir, filename);
    if (!file.exists)
        file.create();
    await file.write(JSON.stringify(obj));
}

// returns null if the file doesn't exist
async function read_json(dir, filename)
{
    const file = new File(dir, filename);
    if (!file.exists)
        return null;
    return JSON.parse(await file.text());
}

// save the raw schema, not the converted one: JSON turns the converted schema's NaN values into null
export async function save_input(name, raw_schema)
{
    await write_json(run_dir(name), "input_schema.json", raw_schema);
}

// returns the raw schema (run it through convert_check_schema before simulating), or null
export async function load_input(name)
{
    return await read_json(run_dir(name), "input_schema.json");
}

export async function save_output(name, output)
{
    await write_json(run_dir(name), "output.json", output);
}

// returns the saved run_optimizer result, or null
export async function load_output(name)
{
    return await read_json(run_dir(name), "output.json");
}

export async function save_info(name, info)
{
    await write_json(run_dir(name), "run_info.json", info);
}

// returns the saved run info, or null
export async function load_info(name)
{
    return await read_json(run_dir(name), "run_info.json");
}

// app settings live in <document dir>/settings.json, outside runs/ so list_runs never sees them
// made on first use, like runs_dir
function settings_file()
{
    return new File(Paths.document, "settings.json");
}

// returns the saved settings, or {} if there are none yet (or the file can't be read)
export async function load_settings()
{
    try
    {
        const file = settings_file();
        if (!file.exists)
            return {};
        return JSON.parse(await file.text());
    }
    catch
    {
        return {};
    }
}

export async function save_settings(settings)
{
    const file = settings_file();
    if (!file.exists)
        file.create();
    await file.write(JSON.stringify(settings));
}

export function list_runs()
{
    const runs = runs_dir();
    if (!runs.exists)
        return [];
    return runs.list().filter((item) => item instanceof Directory).map((item) => item.name);
}

export function delete_run(name)
{
    const dir = run_dir(name);
    if (dir.exists)
        dir.delete();
}
