import { Redirect, Stack, router, usePreventRemove } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import LoadingScreen from "../components/LoadingScreen.js";
import start_run from "../lib/start_run.js";
import { useDraftRun } from "../state/DraftRunContext.js";
import { COLORS } from "../components/theme.js";

/**
 * "Simulating": runs the draft through the engine, saves it, then opens its results.
 * The optimizer blocks the app's JavaScript until it's done, so nothing on screen can be tapped meanwhile;
 * the spinner still moves because the phone draws it.
 */
export default function SimulatingScreen()
{
    const { draft, finish_run } = useDraftRun();
    const [error, set_error] = useState(null);
    const [seconds, set_seconds] = useState(null);
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
                await start_run(draft.name, draft.mode, draft.form);
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

    return (
        <>
            {/* no back arrow or swipe while it runs */}
            <Stack.Screen options={{ headerBackVisible: false, gestureEnabled: false }} />
            <LoadingScreen
                message="Simulating"
                detail={"Trying every way to split your workers across the stations.\nThis can take a minute on some phones, so please keep the app open."}
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
