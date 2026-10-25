import { Redirect, Stack, router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import HomeButton from "../components/HomeButton.js";
import { QUESTIONS } from "../lib/ai_client.js";
import { useDraftRun } from "../state/DraftRunContext.js";

/**
 * Simple mode: the five questions on one scrolling screen, answered in the user's own words.
 * Submit sends them all to the AI in one call (on the Generating screen); Skip goes straight to the pages, all blank.
 */
export default function QuestionsScreen()
{
    const { draft, save_answers, skip_questions } = useDraftRun();
    const insets = useSafeAreaInsets();
    // start from earlier answers if the user came back from a later screen
    const [answers, set_answers] = useState(() => draft?.answers ?? Object.fromEntries(QUESTIONS.map((q) => [q.key, ""])));
    const [show_error, set_show_error] = useState(false);

    if (draft === null)
        return <Redirect href="/" />;

    // the AI can't find any stations without the first answer
    const steps_missing = answers["steps"].trim() === "";

    function submit()
    {
        if (steps_missing)
        {
            set_show_error(true);
            return;
        }
        save_answers(answers);
        router.push("/generating");
    }

    function skip()
    {
        skip_questions();
        router.push("/intro");
    }

    return (
        <View style={styles.screen}>
            <Stack.Screen options={{ title: "Tell us about your site", headerRight: () => <HomeButton /> }} />
            <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
                <Text style={styles.intro}>
                    Answer in your own words. We&apos;ll use your answers to fill in the details, and you&apos;ll check them next.
                    Only the first question is needed.
                </Text>

                {QUESTIONS.map((q, i) => (
                    <View key={q.key} style={styles.question}>
                        <Text style={styles.question_text}>{i + 1}. {q.text}</Text>
                        <TextInput
                            style={[styles.box, i === 0 && show_error && steps_missing && styles.box_error]}
                            value={answers[q.key]}
                            onChangeText={(text) => set_answers({ ...answers, [q.key]: text })}
                            multiline
                            textAlignVertical="top"
                            maxLength={1000}
                            accessibilityLabel={q.text}
                        />
                        {i === 0 && show_error && steps_missing ? (
                            <Text style={styles.error} accessibilityLiveRegion="polite">Please answer this one, or tap Skip to fill in the pages yourself.</Text>
                        ) : null}
                    </View>
                ))}
            </ScrollView>

            <View style={[styles.bar, { paddingBottom: 12 + insets.bottom }]}>
                <Pressable style={styles.skip} onPress={skip} accessibilityRole="button" accessibilityHint="Skips the questions; every page starts blank">
                    <Text style={styles.skip_text}>Skip</Text>
                </Pressable>
                <Pressable style={styles.submit} onPress={submit} accessibilityRole="button">
                    <Text style={styles.submit_text}>Submit</Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#f7f7f7" },
    body: { padding: 20, paddingBottom: 32 },
    intro: { fontSize: 16, lineHeight: 22, color: "#444", marginBottom: 20 },
    question: { marginBottom: 22, gap: 8 },
    question_text: { fontSize: 17, lineHeight: 24, fontWeight: "600", color: "#1a1a1a" },
    box: {
        minHeight: 110, padding: 12,
        borderWidth: 2, borderColor: "#c4c4c4", borderRadius: 8,
        fontSize: 17, lineHeight: 23, color: "#1a1a1a", backgroundColor: "#fff",
    },
    // only the color changes (see NumberInput)
    box_error: { borderColor: "#b3261e" },
    error: { fontSize: 15, color: "#b3261e" },
    bar: { flexDirection: "row", gap: 12, paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#e2e2e2", backgroundColor: "#fff" },
    skip: { flex: 1, minHeight: 52, borderRadius: 8, borderWidth: 2, borderColor: "#1d5fd1", alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
    skip_text: { fontSize: 18, fontWeight: "600", color: "#1d5fd1" },
    submit: { flex: 2, minHeight: 52, borderRadius: 8, backgroundColor: "#1d5fd1", alignItems: "center", justifyContent: "center" },
    submit_text: { fontSize: 18, fontWeight: "600", color: "#fff" },
});
