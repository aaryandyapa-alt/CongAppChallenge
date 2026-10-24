import { createContext, useContext, useMemo, useReducer } from "react";

import { blank_form, blank_station, schema_to_form } from "../lib/form_to_schema.js";
import { check_form, MAX_STATIONS } from "../lib/form_checks.js";

/**
 * The run being set up, kept in memory only. Nothing is saved until the simulation finishes (see lib/start_run.js),
 * so leaving partway just drops the draft.
 *
 * Draft shape (null when there's no draft):
 * {
 *   name, mode,              // mode is "simple" or "pro"; name is null for a duplicate until it's named
 *   start_state,             // "pro", "skipped", "ai-full", "ai-partial", "ai-failed" or "duplicate"; null before the questions
 *   page,                    // the review page being shown
 *   form,                    // see lib/form_to_schema.js
 *   starred,                 // form paths like "stations.1.minutes" -> true, for fields the AI couldn't fill
 *   edited_this_visit,       // starred paths changed on the current page; their stars clear when the page is left
 * }
 */

function new_draft(name, mode, start_state, form, starred)
{
    return { name: name, mode: mode, start_state: start_state, page: 0, form: form, starred: starred, edited_this_visit: [] };
}

// a copy of obj with the value at path (a list of keys) replaced; only the objects along the path are copied
function set_path(obj, path, value)
{
    if (path.length === 0)
        return value;
    const copy = Array.isArray(obj) ? [...obj] : { ...obj };
    copy[path[0]] = set_path(obj[path[0]], path.slice(1), value);
    return copy;
}

// exported so it can be tested without React
export function draft_reducer(draft, action)
{
    switch (action.type)
    {
        case "begin_run":
            return new_draft(action.name, action.mode, action.mode === "pro" ? "pro" : null, blank_form(), {});

        // a saved run's input schema, copied into a new draft that keeps its mode
        case "begin_duplicate":
            return new_draft(null, action.mode, "duplicate", schema_to_form(action.schema).form, {});

        case "set_name":
            return { ...draft, name: action.name };

        // Simple mode: Skip on the questions screen
        case "skip_questions":
            return new_draft(draft.name, draft.mode, "skipped", blank_form(), {});

        // Simple mode: the AI's input schema, which may have null fields
        case "fill_from_ai":
        {
            const result = schema_to_form(action.schema);
            // no stations came back, so everything starts blank
            if (result === null)
                return new_draft(draft.name, draft.mode, "ai-failed", blank_form(), {});
            const start_state = Object.keys(result.starred).length === 0 ? "ai-full" : "ai-partial";
            return new_draft(draft.name, draft.mode, start_state, result.form, result.starred);
        }

        case "edit_field":
        {
            const keys = action.path.split(".").map((k) => /^\d+$/.test(k) ? Number(k) : k);
            let form = set_path(draft.form, keys, action.value);

            // adding stations: reuse removed ones from the cache, and only make new ones past the end of it
            // (never past MAX_STATIONS; a larger count is shown as an error instead)
            const wanted = Math.min(action.value, MAX_STATIONS);
            if (action.path === "basics.station_count" && Number.isInteger(action.value) && wanted > form.stations.length)
            {
                const added = Array.from({ length: wanted - form.stations.length }, blank_station);
                form = { ...form, stations: [...form.stations, ...added] };
            }

            // a starred field keeps its star until the user leaves the page
            let edited = draft.edited_this_visit;
            if (draft.starred[action.path] && !edited.includes(action.path))
                edited = [...edited, action.path];

            return { ...draft, form: form, edited_this_visit: edited };
        }

        // Next, tapping a progress circle and Back all go through here
        case "go_to_page":
        {
            const starred = { ...draft.starred };
            for (const path of draft.edited_this_visit)
                delete starred[path];
            return { ...draft, page: action.page, starred: starred, edited_this_visit: [] };
        }

        case "clear":
            return null;

        default:
            throw new Error(`Unknown draft action "${action.type}"`);
    }
}

const DraftRunContext = createContext(null);

// wraps the whole app in src/app/_layout.js
export function DraftRunProvider({ children })
{
    const [draft, dispatch] = useReducer(draft_reducer, null);

    // dispatch never changes, so these are made once
    const actions = useMemo(() => ({
        begin_run: (name, mode) => dispatch({ type: "begin_run", name: name, mode: mode }),
        begin_duplicate: (mode, schema) => dispatch({ type: "begin_duplicate", mode: mode, schema: schema }),
        set_name: (name) => dispatch({ type: "set_name", name: name }),
        skip_questions: () => dispatch({ type: "skip_questions" }),
        fill_from_ai: (schema) => dispatch({ type: "fill_from_ai", schema: schema }),
        edit_field: (path, value) => dispatch({ type: "edit_field", path: path, value: value }),
        go_to_page: (page) => dispatch({ type: "go_to_page", page: page }),
        clear_draft: () => dispatch({ type: "clear" }),
    }), []);

    // checked on every change, so screens always show up-to-date problems
    const errors = useMemo(() => draft === null ? {} : check_form(draft.form, draft.mode), [draft]);

    const value = useMemo(() => ({ draft: draft, errors: errors, ...actions }), [draft, errors, actions]);
    return <DraftRunContext value={value}>{children}</DraftRunContext>;
}

/**
 * The star and error for one field, ready to spread onto a StarredField: <StarredField {...field_status(draft, errors, path)} />
 */
export function field_status(draft, errors, path)
{
    return { starred: !!draft.starred[path], error: errors[path] ?? null };
}

/**
 * For screens: const { draft, errors, edit_field, go_to_page, ... } = useDraftRun();
 * (React requires hook names to start with "use", so this one isn't snake_case.)
 */
export function useDraftRun()
{
    const value = useContext(DraftRunContext);
    if (value === null)
        throw new Error("useDraftRun must be used inside DraftRunProvider");
    return value;
}
