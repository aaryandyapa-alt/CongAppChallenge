import { Redirect, Stack, router, usePreventRemove } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import LoadingScreen from "../components/LoadingScreen.js";
import start_run from "../lib/start_run.js";
import { useDraftRun } from "../state/DraftRunContext.js";
import { COLORS } from "../components/theme.js";

// what each optimizer stage is shown as (see run_optimizer_steps in optimization.js)
const TUNING_DETAIL = "Moving one worker at a time to see if it helps";
const STAGES = {
    "every_split": { title: "Trying every way to split your workers", detail: null },
    "building": { title: "Building a strong starting setup", detail: "Adding one worker at a time where it helps most" },
    "tuning_mean": { title: "Fine-tuning for the shortest average wait", detail: TUNING_DETAIL },
    "tuning_p90": { title: "Fine-tuning for the shortest long waits", detail: TUNING_DETAIL },
    "tuning_balance": { title: "Fine-tuning for the most even workload", detail: TUNING_DETAIL },
    "final_check": { title: "Double-checking the best setups", detail: "Running them for more simulated days" },
    "saving": { title: "Saving your run", detail: null },
};

// how many stations to name in the "Now trying" line before saying "and N more"
const NAMED_STATIONS = 3;

// "Now trying: Intake 2 · Groceries 3 · Checkout 1", from a progress update and the draft's station names
function trying_text(update, stations)
{
    if (!update?.alloc)
        return null;
    const parts = update.alloc.map((workers, k) => `${stations[update.staffed_ids[k]]?.name ?? "Station"} ${workers}`);
    const shown = parts.slice(0, NAMED_STATIONS).join("  ·  ");
    const more = parts.length > NAMED_STATIONS ? `  and ${parts.length - NAMED_STATIONS} more` : "";
    return `${update.stage === "final_check" ? "Now checking" : "Now trying"}: ${shown}${more}`;
}

/**
 * "Simulating": runs the draft through the engine, saves it, then opens its results.
 * The engine runs in short bursts (see lib/start_run.js), and between them this screen updates the progress bar,
 * the stage, and the split being tried.
 */
export default function SimulatingScreen()
{
    const { draft, finish_run } = useDraftRun();
    const [error, set_error] = useState(null);
    const [seconds, set_seconds] = useState(null);
    // the latest progress update from start_run, or null before the first one
    const [update, set_update] = useState(null);
    // only run once, even if the screen re-renders
    const started = useRef(false);

    // no leaving while it runs; after an error, Back returns to the review
    usePreventRemove(error === null && !draft?.finished);

    useEffect(() =>
    {
        if (draft === null || started.current)
            return;
        started.current = true;

        // wait a moment so the spinner is on screen before the simulation takes over
        let fired = false;
        const timer = setTimeout(async () =>
        {
            fired = true;
            const t0 = Date.now();
            try
            {
                await start_run(draft.name, draft.mode, draft.form, set_update);
                set_seconds((Date.now() - t0) / 1000);
                finish_run();
            }
            catch (e)
            {
                set_error(e.message ?? String(e));
            }
        }, 100);
        // if this is undone before the timer fires, allow it to start again next time
        return () =>
        {
            if (!fired)
            {
                clearTimeout(timer);
                started.current = false;
            }
        };
    }, [draft, finish_run]);

    // once the review screens have stopped blocking Back (draft.finished), close them all and show the results.
    // Back from the results then goes Home, not into the finished review.
    useEffect(() =>
    {
        if (!draft?.finished || seconds === null)
            return;
        const name = draft.name;
        // one tick later, so every screen has seen draft.finished first
        const timer = setTimeout(() =>
        {
            router.dismissAll();
            // TEMPORARY: took= shows the run time on the results placeholder; remove in step 8
            router.push({ pathname: "/results/[name]", params: { name: name, from: "new", took: seconds.toFixed(1) } });
        }, 0);
        return () => clearTimeout(timer);
    }, [draft?.finished, draft?.name, seconds]);

    if (draft === null)
        return <Redirect href="/" />;

    if (error !== null)
    {
        return (
            <View style={styles.error_screen}>
                <Stack.Screen options={{ title: "Something went wrong" }} />
                <Text style={styles.error_title}>The simulation couldn&apos;t run</Text>
                <Text style={styles.error_text}>Nothing was saved. Go back to check your answers, then try again.</Text>
                <Text style={styles.error_detail}>{error}</Text>
                <Pressable style={styles.button} onPress={() => router.back()} accessibilityRole="button">
                    <Text style={styles.button_text}>Back to review</Text>
                </Pressable>
            </View>
        );
    }

    const stage = STAGES[update?.stage] ?? { title: "Getting started", detail: null };
    // trying every split says how far through the list it is
    const stage_detail = update?.stage === "every_split" && update.splits ? `Split ${update.split} of ${update.splits}` : stage.detail;

    return (
        <>
            {/* no back arrow or swipe while it runs */}
            <Stack.Screen options={{ headerBackVisible: false, gestureEnabled: false }} />
            <LoadingScreen
                message="Simulating"
                progress={update?.fraction ?? 0}
                status={stage.title}
                status_detail={stage_detail}
                note={trying_text(update, draft.form.stations)}
                footer="This can take a minute on some phones, so please keep the app open."
            />
        </>
    );
}

const styles = StyleSheet.create({
    error_screen: { flex: 1, padding: 24, gap: 14, justifyContent: "center", backgroundColor: COLORS.background },
    error_title: { fontSize: 22, fontWeight: "600", color: COLORS.text },
    error_text: { fontSize: 17, lineHeight: 24, color: COLORS.text },
    error_detail: { fontSize: 13, color: COLORS.text_detail },
    button: { marginTop: 12, minHeight: 52, borderRadius: 8, backgroundColor: COLORS.accent, alignItems: "center", justifyContent: "center" },
    button_text: { fontSize: 18, fontWeight: "600", color: COLORS.on_accent },
});
