import { Redirect, Stack, router, usePreventRemove } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import GlowBackground from "../components/GlowBackground.js";
import LoadingScreen from "../components/LoadingScreen.js";
import PrimaryButton from "../components/PrimaryButton.js";
import start_run from "../lib/start_run.js";
import { useDraftRun } from "../state/DraftRunContext.js";
import { CARD_SHADOW, COLORS, FONTS, RADIUS } from "../components/theme.js";

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
    // true once this screen's run has finished and been saved
    const [done, set_done] = useState(false);
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
            try
            {
                // start_run also saves how long the simulation took, in run_info.json
                await start_run(draft.name, draft.mode, draft.form, set_update);
                set_done(true);
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
        if (!draft?.finished || !done)
            return;
        const name = draft.name;
        // one tick later, so every screen has seen draft.finished first
        const timer = setTimeout(() =>
        {
            router.dismissAll();
            router.push({ pathname: "/results/[name]", params: { name: name, from: "new" } });
        }, 0);
        return () => clearTimeout(timer);
    }, [draft?.finished, draft?.name, done]);

    if (draft === null)
        return <Redirect href="/" />;

    if (error !== null)
    {
        return (
            <View style={styles.error_screen}>
                <GlowBackground />
                <View style={styles.error_card}>
                    <Text style={styles.error_title}>The simulation couldn&apos;t run</Text>
                    <Text style={styles.error_text}>Nothing was saved. Go back to check your answers, then try again.</Text>
                    <Text style={styles.error_detail}>{error}</Text>
                    <PrimaryButton label="Back to review" on_press={() => router.back()} style={styles.button} />
                </View>
            </View>
        );
    }

    const stage = STAGES[update?.stage] ?? { title: "Getting started", detail: null };
    // trying every split says how far through the list it is
    const stage_detail = update?.stage === "every_split" && update.splits ? `Split ${update.split} of ${update.splits}` : stage.detail;

    return (
        <>
            {/* no title bar, back button or swipe while it runs */}
            <Stack.Screen options={{ gestureEnabled: false }} />
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
    error_screen: { flex: 1, padding: 20, justifyContent: "center", backgroundColor: COLORS.background },
    // a glass card, like the loading card it replaces
    error_card: {
        padding: 24, gap: 14, borderRadius: RADIUS.panel,
        backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.glass_edge, ...CARD_SHADOW,
    },
    error_title: { fontSize: 24, fontFamily: FONTS.extrabold, color: COLORS.text, letterSpacing: -0.4 },
    error_text: { fontFamily: FONTS.regular, fontSize: 17, lineHeight: 24, color: COLORS.text },
    error_detail: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.text_detail },
    button: { marginTop: 12 },
});
