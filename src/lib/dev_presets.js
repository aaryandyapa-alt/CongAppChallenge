// TEMPORARY: ready-made runs for timing the simulation on a phone; delete in step 9 with Home's temporary links.
// Each is an input schema, loaded like a duplicated run.

import small from "../../runs/test-2/input_schema.json";

const station = (id, label, workers, mean) =>
    ({ "id": id, "label": label, "workers": workers, "service_time_minutes": { "distribution": "lognormal", "mean": mean, "stddev": mean * 0.4 } });

// 6 stations (1 customer-led), 15 workers, 60 arrivals per hour over 8 hours
const medium = {
    "stations": [
        station(0, "Check-in", 2, 3), station(1, "Intake", 3, 6), station(2, "Self-serve shelves", 0, 8),
        station(3, "Produce", 4, 7), station(4, "Dairy", 3, 4), station(5, "Checkout", 3, 5),
    ],
    "routing": "linear",
    "arrival_pattern": { "type": "bursty", "avg_arrivals_per_hour": 60, "peak_time": 12, "burst_frac": 0.5 },
    "operating_hours": { "open": 9, "close": 17 },
    "constraints": { "max_total_workers": 15 },
    "simulation_settings": { "num_replications": 50, "random_seed": 42 },
};

// 10 stations (1 customer-led), 30 workers, 100 arrivals per hour over 10 hours
const large = {
    "stations": [
        station(0, "Greeting", 2, 2), station(1, "Check-in", 3, 4), station(2, "Intake", 4, 6), station(3, "Self-serve shelves", 0, 10),
        station(4, "Produce", 4, 5), station(5, "Dairy", 3, 4), station(6, "Bread", 3, 3), station(7, "Hygiene items", 3, 4),
        station(8, "Packing", 4, 5), station(9, "Checkout", 4, 4),
    ],
    "routing": "linear",
    "arrival_pattern": { "type": "bursty", "avg_arrivals_per_hour": 100, "peak_time": 13, "burst_frac": 0.6 },
    "operating_hours": { "open": 8, "close": 18 },
    "constraints": { "max_total_workers": 30 },
    "simulation_settings": { "num_replications": 50, "random_seed": 42 },
};

export const DEV_PRESETS = [
    { label: "Small: 3 stations, 6 workers", short: "Small", schema: small },
    { label: "Medium: 6 stations, 15 workers", short: "Medium", schema: medium },
    // about 19 seconds on a PC, so expect much longer on a phone
    { label: "Large (slow): 10 stations, 30 workers", short: "Large", schema: large },
];
