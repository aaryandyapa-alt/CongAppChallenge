"use strict";

import { mulberry32, exponential, lognormal, bursty_arrival, pick_random_index, createCounter } from "./random.js";
import MinHeap from "./min_heap.js";

// separate streams so a change in one (e.g. staffing changing how many service times are drawn) doesn't shift the others
let rng_arrivals;
let rng_service;
let rng_ties;
let state;
let event_list;
let event_counter;   // numbers events in the order they're made, to break ties between events at the same time
let input;
let customer_counter;

class Event
{
    constructor(method, time, customer)
    {
        this.method = method;
        this.time = time;
        this.customer = customer;
        this.seq = event_counter++;
    }
}

// true if event a comes before event b: earlier time first, then the order they were made
function earlier(a, b)
{
    return a.time < b.time || (a.time === b.time && a.seq < b.seq);
}

class Customer
{
    constructor(id, arrival_time, service_times, departure_time)
    {
        this.id = id;
        this.arrival_time = arrival_time;
        this.service_times = service_times;
        this.departure_time = departure_time;
    }

    setArrivalTime(t)
    {
        this.arrival_time = t;
    }

    setQueueStart(n, t)
    {
        this.service_times[n]["queue"] = t;
    }

    setServiceStart(n, t)
    {
        if (this.service_times[n]["queue"] === null)
            this.service_times[n]["queue"] = t;
        this.service_times[n]["start"] = t;
    }

    setServiceEnd(n, t)
    {
        this.service_times[n]["end"] = t;
    }

    setDepartureTime(t)
    {
        this.departure_time = t;
    }
}

class Station
{
    constructor(name, pos, timings, workers)
    {
        this.name = name;
        this.pos = pos;
        this.timings = timings;
        this.workers = workers;
        this.in_service = 0;
        this.queue = [];
        // running totals for the balance metric (see calculate_balance in optimization.js)
        this.busy = 0;            // minutes spent serving
        this.earliest = Infinity; // when the first service started
        this.latest = 0;          // when the last service ended
    }

    pull_queue()
    {
        this.in_service--;
        if (this.queue.length !== 0)
            this.service(this.queue.shift());

    }

    arrival(customer)
    {
        if (this.in_service < this.workers)
            this.service(customer);
        else
        {
            this.queue.push(customer);
            customer.setQueueStart(this.pos, state["time"]);
        }
    }

    service(customer)
    {
        this.in_service++;
        customer.setServiceStart(this.pos, state["time"]);
        // time only moves forward, so the first service is the earliest
        if (this.earliest === Infinity)
            this.earliest = state["time"];

        const dept_time = state["time"] + customer.service_times[this.pos]["service_length"];
        event_list.push(new Event((c) => this.departure(c), dept_time, customer));

    }

    departure(customer)
    {
        customer.setServiceEnd(this.pos, state["time"])
        this.busy += state["time"] - customer.service_times[this.pos]["start"];
        // also only moves forward, so the last departure is the latest
        this.latest = state["time"];
        this.pull_queue();
        const next_station = state[this.pos+1];
        next_station.arrival(customer);
    }
}

class CustomerLedStation extends Station
{
    constructor(name, pos, timings, workers)
    {
        super(name, pos, timings, workers);
    }

    arrival(customer)
    {
        this.service(customer);
    }

    departure(customer)
    {
        this.in_service--;
        customer.setServiceEnd(this.pos, state["time"])
        const next_station = state[this.pos+1];
        next_station.arrival(customer);
    }
}

class DepartureStation extends Station
{
    constructor(name, pos, timings, workers)
    {
        super(name, pos, timings, workers);
    }

    // overrides Station arrival(), used to depart a customer from the establishment
    arrival(customer)
    {
        customer.setDepartureTime(state["time"]);
    }
}

function store_arrival(customer)
{
    generate_next_customer();
    state[0].arrival(customer)
}

function sample_service_time(timings)
{
    if (timings["distribution"] === "exponential")
        return exponential(rng_service, 1/timings["mean"]);
    else if (timings["distribution"] === "lognormal")
    {
        const stddev = timings["stddev"];
        const mean = timings["mean"];
        const sigma_sq = Math.log(1 + (stddev/mean)**2);
        const mu = Math.log(mean) - sigma_sq/2;
        return lognormal(rng_service, Math.sqrt(sigma_sq), mu);
    }
    else
        throw new Error(`Unknown distribution "${timings["distribution"]}"`);
}

function generate_next_customer()
{
    const avg_arrivals_min = input["arrival_pattern"]["avg_arrivals_per_min"];
    const peak_min = input["arrival_pattern"]["peak_min"];
    const total_mins = input["operating_mins"];
    const burst_frac = input["arrival_pattern"]["burst_frac"];
    const arr_type = input["arrival_pattern"]["type"];
    let arr_time; 
    if (arr_type==="bursty")
        arr_time = bursty_arrival(rng_arrivals, avg_arrivals_min, state["time"], peak_min, total_mins, burst_frac)
    else if (arr_type==="consistent")
        arr_time = state["time"]+exponential(rng_arrivals, avg_arrivals_min);
    else
        throw new Error("Must be bursty or consistent arrivals.")

    if (arr_time <= total_mins)
    {
        let next_val = customer_counter.next().value;
        // service lengths are drawn up front so a customer gets the same ones whatever the staffing
        let service_times = {};
        for (const station of input["stations"])
            service_times[station["id"]] = {"service_length":sample_service_time(station["service_time"]), "queue":null, "start":null, "end":null};
        state["customers"][next_val] = new Customer(next_val, arr_time, service_times, null);
        event_list.push(new Event(store_arrival, arr_time, state["customers"][next_val]));
    }
}

function find_all_lowest_time()
{
    const first = event_list.pop();
    const output = [first];
    while (event_list.size !== 0 && event_list.peek().time === first.time)
        output.push(event_list.pop());
    // the old list scan returned ties newest-first; keep that order so tie-breaking, and the results, stay the same
    output.reverse();
    return output;
}

/**
 * Simulates one day.
 * @param {object} inp - The converted schema (see convert_check_schema.js).
 * @returns {{customers: object, stations: object[]}} customers by id, with every station's queue, start and end times;
 *     and per station (in id order) { workers, busy, earliest, latest }: minutes spent serving, and the first service
 *     start and last service end (earliest is Infinity if nobody reached the station).
 */
export default function run_simulation(inp)
{
    input = inp;
    const seed = input["simulation_settings"]["random_seed"];
    rng_arrivals = mulberry32(seed);
    rng_service = mulberry32(seed ^ 0x9E3779B9);
    rng_ties = mulberry32(seed ^ 0x85EBCA6B);
    customer_counter = createCounter(0, 1);
    event_counter = 0;
    event_list = new MinHeap(earlier);
    const stations = input["stations"];
    state = {};
    // each station's id is its position in the flow
    for (const station of stations)
    {
        const pos = station["id"];
        if (!Number.isInteger(pos) || pos < 0 || pos >= stations.length)
            throw new RangeError(`Station "${station["label"]}" has id ${pos}, which must be an integer in [0, ${stations.length - 1}]`);
        if (pos in state)
            throw new RangeError(`More than one station has id ${pos}`);

        if (station["workers"]>0)
            state[pos] = new Station(station["label"], pos, station["service_time"], station["workers"]);
        else if (station["workers"] === 0)
            state[pos] = new CustomerLedStation(station["label"], pos, station["service_time"], station["workers"]);
        else
            throw new RangeError("Station " + pos + " must have workers >= 0");
    }
        
    state[stations.length] = new DepartureStation("departure", stations.length, {}, Infinity)
    state["customers"] = {};
    state["time"] = 0;
    //console.log(state)


    // start loop
    generate_next_customer();
    while (event_list.size !== 0)
    {
        let events_now = find_all_lowest_time();
        state["time"] = events_now[0].time;
        while (events_now.length !== 0)
        {
            let ind = pick_random_index(rng_ties, events_now);
            let current_event = events_now[ind];
            events_now.splice(ind, 1);
            current_event.method(current_event.customer)
        }
    }

    // per-station totals for the balance metric, in station id order (index i is the station with id i)
    const station_stats = [];
    for (let i=0; i<stations.length; i++)
        station_stats.push({ "workers": state[i].workers, "busy": state[i].busy, "earliest": state[i].earliest, "latest": state[i].latest });

    return { "customers": state["customers"], "stations": station_stats };
}
