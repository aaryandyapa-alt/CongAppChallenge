"use strict";

/**
 * A binary min-heap: items go in in any order and come back out smallest first.
 * What "smallest" means is decided by the comparison function passed in, so it works for any kind of item.
 * push and pop take about log2(n) steps, instead of scanning every item.
 *
 * Written to be fast on phones, whose JavaScript engine (Hermes) interprets code instead of compiling it:
 * items are shifted along and the moving item is written once at its final place (no swapping), and
 * this.items and this.less are read into local variables once per call.
 */
export default class MinHeap
{
    /**
     * @param {Function} less - less(a, b) returns true if a should come out before b.
     */
    constructor(less)
    {
        this.less = less;
        this.items = [];
    }

    get size()
    {
        return this.items.length;
    }

    // the item that pop would return, without removing it (undefined if empty)
    peek()
    {
        return this.items[0];
    }

    push(item)
    {
        const h = this.items;
        const less = this.less;
        let i = h.length;
        h.push(item);
        // move parents down until item's place is found, then put item there once
        while (i > 0)
        {
            const parent = (i - 1) >> 1;
            const p = h[parent];
            if (!less(item, p))
                break;
            h[i] = p;
            i = parent;
        }
        h[i] = item;
    }

    // removes and returns the smallest item (undefined if empty)
    pop()
    {
        const h = this.items;
        const less = this.less;
        const top = h[0];
        const last = h.pop();
        const n = h.length;
        if (n !== 0)
        {
            // move the smaller child up until last's place is found, then put last there once
            let i = 0;
            while (true)
            {
                let child = 2 * i + 1;
                if (child >= n)
                    break;
                if (child + 1 < n && less(h[child + 1], h[child]))
                    child++;
                if (!less(h[child], last))
                    break;
                h[i] = h[child];
                i = child;
            }
            h[i] = last;
        }
        return top;
    }
}
