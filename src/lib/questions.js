"use strict";

/**
 * The five Simple-mode questions, worded exactly as decided. key is the answer's name in the request to the AI proxy.
 * Used by both the phone (the questions screen, through ai_client.js) and the server (ai_extraction.js), so it's kept
 * in its own small file: the phone doesn't need the server's extraction code.
 */
export const QUESTIONS = [
    { key: "steps", text: "What are the steps someone goes through, in order?" },
    { key: "workers", text: "How many people work at each step?" },
    { key: "times", text: "About how long does each step take, and does it vary a lot or stay pretty consistent?" },
    { key: "arrivals", text: "About how many people come in per hour, and is there a busier time of day? If so, how much busier?" },
    { key: "hours", text: "When do you open and close?" },
];
