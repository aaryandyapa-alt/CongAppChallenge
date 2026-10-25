import { Redirect, Stack, router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import LoadingScreen from "../components/LoadingScreen.js";
import { extract } from "../lib/ai_client.js";
import { useDraftRun } from "../state/DraftRunContext.js";

/**
 * "Generating values": sends the five answers to the AI in one call, fills the draft from the reply, then opens the intro.
 * The intro's message depends on what came back (everything, some fields, or no stations), via fill_from_ai.
 */
export default function GeneratingScreen()
{
    const { draft, fill_from_ai, skip_questions } = useDraftRun();
    const [failed, set_failed] = useState(false);
    // bumped by Try again to send the answers again
    const [attempt, set_attempt] = useState(0);
    const answers = draft?.answers;

    useEffect(() =>
    {
        if (!answers)
            return;
        // if the user goes back while it's loading, ignore the reply
        let active = true;
        extract(answers)
            .then((result) =>
            {
                if (!active)
                    return;
                fill_from_ai(result.schema);
                // replace, so Back from the intro returns to the questions, not to this spinner
                router.replace("/intro");
            })
            .catch(() =>
            {
                if (active)
                    set_failed(true);
            });
        return () =>
        {
            active = false;
        };
    }, [answers, attempt, fill_from_ai]);

    // opened without submitted answers (for example from a stale link)
    if (!answers)
        return <Redirect href="/" />;

    if (failed)
    {
        return (
            <View style={styles.error_screen}>
                <Stack.Screen options={{ title: "Couldn't reach the AI" }} />
                <Text style={styles.error_text}>
                    We couldn&apos;t reach the AI. Check your connection and try again, or fill in the pages yourself.
                </Text>
                <Pressable
                    style={styles.primary}
                    onPress={() =>
                    {
                        set_failed(false);
                        set_attempt(attempt + 1);
                    }}
                    accessibilityRole="button"
                >
                    <Text style={styles.primary_text}>Try again</Text>
                </Pressable>
                <Pressable
                    style={styles.secondary}
                    onPress={() =>
                    {
                        // the same as Skip: every page starts blank
                        skip_questions();
                        router.replace("/intro");
                    }}
                    accessibilityRole="button"
                >
                    <Text style={styles.secondary_text}>Fill in myself</Text>
                </Pressable>
            </View>
        );
    }

    return <LoadingScreen message="Generating values" detail="Reading your answers. This usually takes a few seconds." />;
}

const styles = StyleSheet.create({
    error_screen: { flex: 1, padding: 24, gap: 14, justifyContent: "center", backgroundColor: "#f7f7f7" },
    error_text: { fontSize: 18, lineHeight: 26, color: "#1a1a1a", marginBottom: 8 },
    primary: { minHeight: 52, borderRadius: 8, backgroundColor: "#1d5fd1", alignItems: "center", justifyContent: "center" },
    primary_text: { fontSize: 18, fontWeight: "600", color: "#fff" },
    secondary: { minHeight: 52, borderRadius: 8, borderWidth: 2, borderColor: "#1d5fd1", alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
    secondary_text: { fontSize: 18, fontWeight: "600", color: "#1d5fd1" },
});
