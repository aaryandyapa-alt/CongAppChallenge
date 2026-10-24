"use strict";

import run_simulation from "./simulation_engine.js";

const EXHAUSTIVE_LIMIT = 200;   // try every combination when there are this many or fewer
const SEARCH_REPS = 20;         // replications per allocation while searching

const OBJECTIVES = {
    "mean_wait": (m) => m["mean_wait"],
    "p90_wait":  (m) => m["p90_wait"],
    "balance":   (m) => m["balance"],
};

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

function calculate_balance(input, customers)
{
    let stations = {};

    for (let i=0; i<input["stations"].length; i++)
        stations[i] = {"busy":0, "u":0, earliest:Infinity, latest:0}
    for (const station of input["stations"])
        stations[station["id"]]["workers"] = station["workers"];

    for (let customer of Object.values(customers))
    {
        for (const [i, s] of Object.entries(customer.service_times))
        {
            stations[i]["busy"] += s["end"] - s["start"];
            if (s["start"]<stations[i]["earliest"])
                stations[i]["earliest"] = s["start"];
            if (s["end"]>stations[i]["latest"])
                stations[i]["latest"] = s["end"];
        }
    }

    for (const [id, s] of Object.entries(stations))
    {
        if (s["workers"] === 0 || s["earliest"] === Infinity)
            delete stations[id];
    }
    if (Object.keys(stations).length === 0)
        return 0;

    let kept_workers = 0;
    for (const s of Object.values(stations))
        kept_workers += s["workers"];

    for (const s of Object.values(stations))
    {
        s["u"] = s["busy"] / (s["workers"] * (s["latest"]-s["earliest"]));
    }

    let weighted_mean = 0;
    for (let s of Object.values(stations))
        weighted_mean += s["u"] * s["workers"];
    weighted_mean /= kept_workers;

    let weighted_stdev = 0;
    for (let s of Object.values(stations))
        weighted_stdev += s["workers"] * Math.pow(s["u"]-weighted_mean, 2);
    weighted_stdev /= kept_workers;
    weighted_stdev = Math.sqrt(weighted_stdev);

    return weighted_stdev;

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

    let waits = []; // by customer
    let utilizations = []; // by day
    for (let seed=initial_seed; seed<initial_seed+n; seed++)
    {
        let customers = run_with_seed(input, seed);
        
        waits = waits.concat(gather_waits(customers));
        
        utilizations.push(calculate_balance(input, customers));
    }

    // no customers arrived in any replication
    if (waits.length === 0)
        return {"mean_wait":0, "p90_wait":0, "balance":0};

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

    return {"mean_wait":mean, "p90_wait":p90, "balance":balance};
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

// returns a function that simulates an allocation once and remembers the result
function make_metrics_cache(input, staffed_ids, reps)
{
    const cache = new Map();
    return function(alloc)
    {
        const key = alloc.join(",");
        if (!cache.has(key))
            cache.set(key, replicate_get_metrics(apply_allocation(input, staffed_ids, alloc), reps));
        return cache.get(key);
    };
}

// one pass over every combination, keeping the best allocation for each objective
function exhaustive_search(get_metrics, total, n_stations)
{
    const best = {};
    for (const name in OBJECTIVES)
        best[name] = { "alloc": null, "score": Infinity };

    for (const alloc of calculate_combinations(total, n_stations))
    {
        const metrics = get_metrics(alloc);
        for (const [name, objective] of Object.entries(OBJECTIVES))
        {
            const sc = objective(metrics);
            if (sc < best[name]["score"])
                best[name] = { "alloc": alloc, "score": sc };
        }
    }

    const winners = {};
    for (const name in best)
        winners[name] = best[name]["alloc"];
    return winners;
}

function greedy_search(get_metrics, objective, total, n_stations, start=null)
{
    const score = (a) => objective(get_metrics(a));
    let alloc;

    if (start !== null)
        alloc = [...start];
    else
    {
        // phase 1: one worker each, then place each remaining worker where it helps most
        alloc = new Array(n_stations).fill(1);
        for (let remaining = total - n_stations; remaining > 0; remaining--)
        {
            let best_k = 0, best = Infinity;
            for (let k=0; k<n_stations; k++)
            {
                alloc[k]++;
                const sc = score(alloc);
                alloc[k]--;
                if (sc < best)
                {
                    best = sc;
                    best_k = k;
                }
            }
            alloc[best_k]++;
        }
    }

    // phase 2: move one worker between stations until no move improves the score
    let current = score(alloc);
    while (true)
    {
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
                const sc = score(alloc);
                alloc[from]++; alloc[to]--;
                if (sc < best)
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

// input is in the form created by convert_check_schema
export default function run_optimizer(input)
{
    const full_reps = input["simulation_settings"]["num_replications"];
    const search_reps = Math.min(SEARCH_REPS, full_reps);

    // only staffed stations are optimized; customer-led stations stay at 0
    const staffed_ids = input["stations"].filter((s) => s["workers"] > 0).map((s) => s["id"]);
    const total = staffed_ids.reduce((sum, id) => sum + input["stations"][id]["workers"], 0);
    const n = staffed_ids.length;

    const search_metrics = make_metrics_cache(input, staffed_ids, search_reps);
    // rerun the winners on seeds the search never used, so their reported metrics aren't biased toward the search days
    const final_input = structuredClone(input);
    final_input["simulation_settings"]["random_seed"] += search_reps;
    const final_metrics = make_metrics_cache(final_input, staffed_ids, full_reps);

    let winners;
    if (n === 0)
        winners = { "mean_wait": [], "p90_wait": [], "balance": [] };   // nothing to allocate
    else if (count_combinations(total, n) <= EXHAUSTIVE_LIMIT)
        winners = exhaustive_search(search_metrics, total, n);
    else
    {
        const best_mean = greedy_search(search_metrics, OBJECTIVES["mean_wait"], total, n);
        const best_p90 = greedy_search(search_metrics, OBJECTIVES["p90_wait"], total, n);
        // balance can't tell candidates apart in phase 1, so start from the best mean-wait allocation
        const best_bal = greedy_search(search_metrics, OBJECTIVES["balance"], total, n, best_mean);
        winners = { "mean_wait": best_mean, "p90_wait": best_p90, "balance": best_bal };
    }

    // the layout that was passed in, so the results can compare it against the winners
    const current = staffed_ids.map((id) => input["stations"][id]["workers"]);
    winners["current"] = current;

    // rerun the winners and the current layout at full replications; if two are the same, the cache runs it only once
    const results = {};
    for (const [name, alloc] of Object.entries(winners))
    {
        const workers = apply_allocation(input, staffed_ids, alloc)["stations"].map((s) => s["workers"]);
        results[name] = { "workers": workers, "metrics": final_metrics(alloc) };
    }
    return results;
}