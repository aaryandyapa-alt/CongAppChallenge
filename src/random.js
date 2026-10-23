export function mulberry32(seed) {
    return function() {
        seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generates a random gap using an exponential distribution. Uses one randomizer function call.
 * 
 * @param {Function} rand - A function that uniformly generates a number in the range [0,1) (like a function of mulberry32).
 * @param {number} rate - The rate value to be used to generate the output.
 * @returns {number} The randomly generated number.
 * @throws {TypeError} If rand and rate are not a vaild function and number, respectively.
 */
export function exponential(rand, rate)
{
    if (typeof rand !== 'function')
        throw new TypeError('rand must be a function');
    if (typeof rate !== 'number')
        throw new TypeError('rate must be a number');            

    return (-1/rate) * Math.log(1-rand());
}

/**
 * Generates a random gap using an lognormal distribution. Uses Box-Muller transform using two randomizer function calls.
 * 
 * @param {Function} rand - A function that uniformly generates a number in the range [0,1) (like a function of mulberry32).
 * @param {number} sigma - The sigma value to be used to generate the output.
 * @param {number} mu - The mu value to be used to generate the output.
 * @returns {number} The randomly generated number.
 * @throws {TypeError} If rand, sigma, and mu are not a vaild function and two valid numbers, respectively.
 */
export function lognormal(rand, sigma, mu)
{
    if (typeof rand !== 'function')
        throw new TypeError('rand must be a function');
    if (typeof sigma !== 'number')
        throw new TypeError('sigma must be a number');
    if (typeof mu !== 'number')
        throw new TypeError('mu must be a number');

    const u1 = 1-rand();
    const u2 = 1-rand();
    
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2*Math.PI * u2);
    const normal = mu + sigma * z;

    return Math.exp(normal);
}

/**
 * For "bursty" arrivals specifically. Generates a time for the next arrival or signifies that the day is over and there are no arrivals left.
 * 
 * @param {Function} rand - A function that uniformly generates a number in the range [0,1) (like a function of mulberry32).
 * @param {number} avg_rate - Average customer intake per minute.
 * @param {number} curr_min 
 * @param {number} peak_min 
 * @param {number} total_mins 
 * @param {number} burst_frac 
 * @returns {number} A time for the next arrival, or Infinity. If Infinity, the day is over and there are no more arrivals.
 */
export function bursty_arrival(rand, avg_rate, curr_min, peak_min, total_mins, burst_frac)
{
    if (typeof rand !== 'function')
        throw new TypeError('rand must be a function');
    if (typeof avg_rate !== 'number')
        throw new TypeError('avg_rate must be a number');
    if (typeof curr_min !== 'number')
        throw new TypeError('curr_min must be a number');
    if (typeof peak_min !== 'number')
        throw new TypeError('peak_min must be a number');
    if (typeof total_mins !== 'number')
        throw new TypeError('total_mins must be a number');
    if (typeof burst_frac !== 'number')
        throw new TypeError('burst_frac must be a number');
    if (burst_frac < 0 || burst_frac > 1)
        throw new RangeError('burst_frac must be in [0, 1]');

    const max_rate = avg_rate * (1+burst_frac);
    const rate_t = function(t) { return avg_rate * (1 + burst_frac*Math.cos(2*Math.PI * (t - peak_min)/total_mins)) };
    
    let cand_t = curr_min + exponential(rand, max_rate);
    if (cand_t > total_mins)
        return Infinity;
    let u = rand();
    let cand_rate = rate_t(cand_t);
    let ratio = cand_rate/max_rate;
    while (u>ratio)
    {
        cand_t += exponential(rand, max_rate);
        if (cand_t > total_mins)
            return Infinity;
        u = rand();
        cand_rate = rate_t(cand_t);
        ratio = cand_rate/max_rate;
    }

    return cand_t;
    
}

/**
 * Returns a random index from the array.
 * @param {*} rand - A function that uniformly generates a number in the range [0,1) (like a function of mulberry32).
 * @param {*} arr - An array.
 * @returns {number} A random index from the array. Returns 0 if the array is empty.
 */
export function pick_random_index(rand, arr)
{
    if (arr.length===0 || arr.length===1)
        return 0;
    return Math.floor(rand()*arr.length);
}

/**
 * Generates a counter that counts infinitely.
 * 
 * @param {number} start
 * @param {number} step
 */
export function* createCounter(start=1, step=1)
{
    let count = start;
    while (true)
    {
        yield count;
        count += step;
    }
}