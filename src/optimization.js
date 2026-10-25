"use strict";

import run_simulation from "./simulation_engine.js";

const EXHAUSTIVE_LIMIT = 200;   // try every combination when there are this many or fewer

// each score is a list compared in order; the later metrics only break ties
const OBJECTIVES = {
    "mean_wait": (m) => [m["mean_wait"], m["p90_wait"], m["balance"]],
    "p90_wait":  (m) => [m["p90_wait"], m["mean_wait"], m["balance"]],
    "balance":   (m) => [m["balance"], m["mean_wait"], m["p90_wait"]],
};
const WORST_SCORE = [Infinity];

// true if score a is strictly better (lower) than score b
function better(a, b)
{
    for (let i=0; i<a.length; i++)
    {
        if (a[i] !== b[i])
            return a[i] < b[i];
    }
    return false;
}

function gather_waits(customers)
{
    let output = [];
    for (let customer of Object.values(customers))
    {
        let wait = 0;
        for (let station of Object.values(customer.service_times))
            wait += station["start"] - station["queue"];
        output.push(wait);
    }
    return output;
}

// one station's utilization for one day: the share of its workers' time spent serving, between its first and last
// service. null for customer-led stations (no workers) and stations nobody reached that day.
// s is one of the per-station totals from run_simulation ({ workers, busy, earliest, latest }).
function station_utilization(s)
{
    if (s["workers"] === 0 || s["earliest"] === Infinity)
        return null;
    return s["busy"] / (s["workers"] * (s["latest"] - s["earliest"]));
}

// stations: the per-station totals from run_simulation ({ workers, busy, earliest, latest }, in id order)
function calculate_balance(stations)
{
    // customer-led stations and ones nobody reached don't count
    const kept = stations.filter((s) => s["workers"] > 0 && s["earliest"] !== Infinity);
    if (kept.length === 0)
        return 0;

    let kept_workers = 0;
    for (const s of kept)
        kept_workers += s["workers"];

    const u = kept.map(station_utilization);

    let weighted_mean = 0;
    kept.forEach((s, i) => weighted_mean += u[i] * s["workers"]);
    weighted_mean /= kept_workers;

    let weighted_stdev = 0;
    kept.forEach((s, i) => weighted_stdev += s["workers"] * Math.pow(u[i] - weighted_mean, 2));
    weighted_stdev /= kept_workers;

    return Math.sqrt(weighted_stdev);
}

function run_with_seed(input, seed)
{
    let new_input = structuredClone(input);
    new_input["simulation_settings"]["random_seed"] = seed;

    return run_simulation(new_input);
}

function replicate_get_metrics(input, n)
{
    let initial_seed = input["simulation_settings"]["random_seed"];
    const n_stations = input["stations"].length;

    let waits = []; // by customer
    let utilizations = []; // the balance of each day
    // per station: utilization added up over the days it served anyone, and how many days that was
    const busy_sum = new Array(n_stations).fill(0);
    const busy_days = new Array(n_stations).fill(0);
    for (let seed=initial_seed; seed<initial_seed+n; seed++)
    {
        const day = run_with_seed(input, seed);

        // push adds to the end; concat copied the whole list every day
        for (const wait of gather_waits(day["customers"]))
            waits.push(wait);

        utilizations.push(calculate_balance(day["stations"]));

        for (let i=0; i<n_stations; i++)
        {
            const u = station_utilization(day["stations"][i]);
            // days a station served nobody are left out of its average
            if (u !== null)
            {
                busy_sum[i] += u;
                busy_days[i]++;
            }
        }
    }

    // per station, in id order: average utilization over the days it served anyone (0 to 1);
    // null for customer-led stations and stations nobody ever reached
    const utilization = busy_sum.map((sum, i) => busy_days[i] === 0 ? null : sum / busy_days[i]);

    // no customers arrived in any replication
    if (waits.length === 0)
        return {"mean_wait":0, "p90_wait":0, "balance":0, "utilization":utilization};

    let mean = 0;
    for (const wait of waits)
        mean += wait;
    mean /= waits.length;
    
    const sorted = [...waits].sort((a, b) => a - b);
    let p90 = sorted[Math.ceil(0.9*sorted.length) - 1];

    let balance = 0;
    for (const util of utilizations)
        balance += util;
    balance /= utilizations.length;

    return {"mean_wait":mean, "p90_wait":p90, "balance":balance, "utilization":utilization};
}

function count_combinations(workers, stations)
{
    const n = workers - 1, k = stations - 1;
    let result = 1;
    for (let i=1; i<=k; i++)
        result = result * (n - k + i) / i;   // stays a whole number at every step
    return result;
}

function* calculate_combinations(workers, stations, min=1)
{
    if (stations === 1)
    {
        if (workers >= min)
            yield [workers];
        return;
    }
    // leave at least `min` for each remaining station
    for (let w=min; w<=workers - min*(stations-1); w++)
    {
        for (const rest of calculate_combinations(workers - w, stations - 1, min))
            yield [w, ...rest];
    }
}

// alloc[k] is the worker count for the station whose id is staffed_ids[k]
function apply_allocation(input, staffed_ids, alloc)
{
    const new_input = structuredClone(input);
    staffed_ids.forEach((id, k) => new_input["stations"][id]["workers"] = alloc[k]);
    new_input["total_workers"] = alloc.reduce((a, b) => a + b, 0);
    return new_input;
}

// returns a generator function that simulates an allocation once and remembers the result.
// Use it as `yield* get_metrics(alloc)`: after each new simulation it pauses (yields the progress object)
// so the app can update the screen; cached allocations return straight away without pausing.
function make_metrics_cache(input, staffed_ids, reps, progress)
{
    const cache = new Map();
    return function* (alloc)
    {
        const key = alloc.join(",");
        if (!cache.has(key))
        {
            cache.set(key, replicate_get_metrics(apply_allocation(input, staffed_ids, alloc), reps));
            progress.done += reps;
            // never claim to be further along than the estimate allows
            progress.estimate = Math.max(progress.estimate, progress.done);
            progress.alloc = [...alloc];   // a copy: the searches change alloc in place afterwards
            yield progress;
        }
        return cache.get(key);
    };
}

// one pass over every combination, keeping the best allocation for each objective
function* exhaustive_search(get_metrics, total, n_stations, progress)
{
    const best = {};
    for (const name in OBJECTIVES)
        best[name] = { "alloc": null, "score": WORST_SCORE };

    progress.stage = "every_split";
    progress.splits = count_combinations(total, n_stations);
    progress.split = 0;
    for (const alloc of calculate_combinations(total, n_stations))
    {
        progress.split++;
        const metrics = yield* get_metrics(alloc);
        for (const [name, objective] of Object.entries(OBJECTIVES))
        {
            const sc = objective(metrics);
            if (better(sc, best[name]["score"]))
                best[name] = { "alloc": alloc, "score": sc };
        }
    }

    const winners = {};
    for (const name in best)
        winners[name] = best[name]["alloc"];
    return winners;
}

// progress.stage is set to "building" during phase 1 and to tuning_stage during phase 2.
// round_estimate is how many simulated days to add to progress.estimate for each phase 2 round after the first
// (0 for searches that mostly reuse allocations already simulated).
function* greedy_search(get_metrics, objective, total, n_stations, start, progress, tuning_stage, round_estimate)
{
    const score = function* (a) { return objective(yield* get_metrics(a)); };
    let alloc;

    if (start !== null)
        alloc = [...start];
    else
    {
        // phase 1: one worker each, then place each remaining worker where it helps most
        progress.stage = "building";
        alloc = new Array(n_stations).fill(1);
        for (let remaining = total - n_stations; remaining > 0; remaining--)
        {
            let best_k = 0, best = WORST_SCORE;
            for (let k=0; k<n_stations; k++)
            {
                alloc[k]++;
                const sc = yield* score(alloc);
                alloc[k]--;
                if (better(sc, best))
                {
                    best = sc;
                    best_k = k;
                }
            }
            alloc[best_k]++;
        }
    }

    // phase 2: move one worker between stations until no move improves the score
    progress.stage = tuning_stage;
    let current = yield* score(alloc);
    for (let round = 1; ; round++)
    {
        // the estimate only counted one round
        if (round > 1)
            progress.estimate += round_estimate;
        let best_move = null, best = current;
        for (let from=0; from<n_stations; from++)
        {
            if (alloc[from] === 1)
                continue;   // every staffed station keeps at least 1
            for (let to=0; to<n_stations; to++)
            {
                if (to === from)
                    continue;
                alloc[from]--; alloc[to]++;
                const sc = yield* score(alloc);
                alloc[from]++; alloc[to]--;
                if (better(sc, best))
                {
                    best = sc;
                    best_move = [from, to];
                }
            }
        }
        if (best_move === null)
            break;
        alloc[best_move[0]]--;
        alloc[best_move[1]]++;
        current = best;
    }

    return alloc;
}

/**
 * The optimizer as a generator, so the app can show progress: it pauses after every simulated allocation and
 * yields a progress object, then returns the same results as run_optimizer. Drive it with next() until done.
 *
 * Progress object (the same object each time, updated in place):
 * {
 *   done, estimate,     // simulated days so far, and the expected total (it can grow; done never passes it)
 *   stage,              // "every_split", "building", "tuning_mean", "tuning_p90", "tuning_balance" or "final_check"
 *   alloc,              // the allocation just simulated (workers per staffed station, in station order)
 *   split, splits,      // during "every_split": which combination this is, out of how many
 *   staffed_ids,        // the station ids alloc's entries belong to
 * }
 *
 * @param {object} input - In the form created by convert_check_schema.
 */
export function* run_optimizer_steps(input)
{
    const full_reps = input["simulation_settings"]["num_replications"];
    const search_reps = Math.max(1,Math.round(0.2*full_reps));

    // only staffed stations are optimized; customer-led stations stay at 0
    const staffed_ids = input["stations"].filter((s) => s["workers"] > 0).map((s) => s["id"]);
    const total = staffed_ids.reduce((sum, id) => sum + input["stations"][id]["workers"], 0);
    const n = staffed_ids.length;

    // at most 4 allocations (3 winners and the current one) are rerun at the end
    const final_estimate = 4 * full_reps;
    const progress = { done: 0, estimate: final_estimate, stage: null, alloc: null, split: 0, splits: 0, staffed_ids: staffed_ids };

    const search_metrics = make_metrics_cache(input, staffed_ids, search_reps, progress);
    // rerun the winners on seeds the search never used, so their reported metrics aren't biased toward the search days
    const final_input = structuredClone(input);
    final_input["simulation_settings"]["random_seed"] += search_reps;
    const final_metrics = make_metrics_cache(final_input, staffed_ids, full_reps, progress);

    let winners;
    if (n === 0)
        winners = { "mean_wait": [], "p90_wait": [], "balance": [] };   // nothing to allocate
    else if (count_combinations(total, n) <= EXHAUSTIVE_LIMIT)
    {
        progress.estimate = count_combinations(total, n) * search_reps + final_estimate;
        winners = yield* exhaustive_search(search_metrics, total, n, progress);
    }
    else
    {
        // phase 1 tries each station for each worker beyond the first; then expect one round of phase 2 moves
        const round = n * (n - 1) * search_reps;
        progress.estimate = (total - n) * n * search_reps + round + final_estimate;
        const best_mean = yield* greedy_search(search_metrics, OBJECTIVES["mean_wait"], total, n, null, progress, "tuning_mean", round);
        // p90 starts from the best mean-wait allocation instead of running its own phase 1: the two usually point the
        // same way, and phase 2 still moves workers to whatever improves p90. Skipping that phase 1 saves its simulations.
        // Its moves are mostly ones already simulated for mean, so no extra rounds are added to the estimate.
        const best_p90 = yield* greedy_search(search_metrics, OBJECTIVES["p90_wait"], total, n, best_mean, progress, "tuning_p90", 0);
        // balance can't tell candidates apart in phase 1, so start from the best mean-wait allocation
        const best_bal = yield* greedy_search(search_metrics, OBJECTIVES["balance"], total, n, best_mean, progress, "tuning_balance", 0);
        winners = { "mean_wait": best_mean, "p90_wait": best_p90, "balance": best_bal };
    }

    // the layout that was passed in, so the results can compare it against the winners
    const current = staffed_ids.map((id) => input["stations"][id]["workers"]);
    winners["current"] = current;

    // now the exact remaining work is known: one full run per different allocation
    progress.stage = "final_check";
    const different = new Set(Object.values(winners).map((alloc) => alloc.join(","))).size;
    progress.estimate = progress.done + different * full_reps;

    // rerun the winners and the current layout at full replications; if two are the same, the cache runs it only once
    const results = {};
    for (const [name, alloc] of Object.entries(winners))
    {
        const workers = apply_allocation(input, staffed_ids, alloc)["stations"].map((s) => s["workers"]);
        results[name] = { "workers": workers, "metrics": yield* final_metrics(alloc) };
    }
    return results;
}

// the optimizer in one go, without pausing (for code that doesn't show progress)
// input is in the form created by convert_check_schema
export default function run_optimizer(input)
{
    const steps = run_optimizer_steps(input);
    let step = steps.next();
    while (!step.done)
        step = steps.next();
    return step.value;
}