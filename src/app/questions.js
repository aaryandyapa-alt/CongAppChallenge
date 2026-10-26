import { Redirect, router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import BottomBar from "../components/BottomBar.js";
import GlowBackground from "../components/GlowBackground.js";
import HomeButton from "../components/HomeButton.js";
import OutlineButton from "../components/OutlineButton.js";
import PrimaryButton from "../components/PrimaryButton.js";
import { BackButton } from "../components/RoundButton.js";
import TopBar from "../components/TopBar.js";
import { QUESTIONS } from "../lib/ai_client.js";
import { useDraftRun } from "../state/DraftRunContext.js";
import { useSettings } from "../state/SettingsContext.js";
import { FONTS, RADIUS } from "../components/theme.js";
import { useThemedStyles } from "../components/ThemeContext.js";

/**
 * Simple mode: the five questions on one scrolling screen, answered in the user's own words.
 * Submit sends them all to the AI in one call (on the Generating screen); Skip goes straight to the pages, all blank.
 */
export default function QuestionsScreen()
{
    const styles = useThemedStyles(make_styles);
    const { draft, save_answers, skip_questions } = useDraftRun();
    const { settings } = useSettings();
    // start from earlier answers if the user came back from a later screen
    const [answers, set_answers] = useState(() => draft?.answers ?? Object.fromEntries(QUESTIONS.map((q) => [q.key, ""])));
    const [show_error, set_show_error] = useState(false);
    // how much of the bottom the floating Submit bar covers; the page gets that much room at its end
    const [bar_height, set_bar_height] = useState(0);

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

    const bar = (
        <BottomBar style={styles.bar} on_height={set_bar_height}>
            <OutlineButton label="Skip" on_press={skip} style={styles.skip} hint="Skips the questions; every page starts blank" />
            <PrimaryButton label="Submit" on_press={submit} style={styles.submit} />
        </BottomBar>
    );
    // the Settings option "Keep the Next button above the keyboard" covers this Submit bar too
    const bar_above_keyboard = settings["bar_above_keyboard"];

    return (
        <View style={styles.screen}>
            <GlowBackground />
            <TopBar left={<BackButton />} right={<HomeButton />} eyebrow="Simple mode" title="Tell us about your site" />
            {/* shrinks above the keyboard so the box being typed in (and the bar, if it's inside) stay visible; see review.js */}
            <KeyboardAvoidingView style={styles.fill} behavior="padding">
                {/* no padding on this view, so the floating bar sits at its very bottom (just above the keyboard) */}
                <View style={styles.fill}>
                    {/* the end of the page gets room for the floating bar, so the last question can scroll out from under it */}
                    <ScrollView contentContainerStyle={[styles.body, { paddingBottom: bar_height + 20 }]} keyboardShouldPersistTaps="handled">
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
                    {bar_above_keyboard ? bar : null}
                </View>
            </KeyboardAvoidingView>
            {bar_above_keyboard ? null : bar}
        </View>
    );
}

const make_styles = ({ COLORS }) => StyleSheet.create({
    screen: { flex: 1, backgroundColor: COLORS.background },
    fill: { flex: 1 },
    // the bottom padding (room for the floating bar) is added in the component
    body: { paddingHorizontal: 20, paddingTop: 8 },
    intro: { fontFamily: FONTS.regular, fontSize: 16, lineHeight: 22, color: COLORS.text_secondary, marginBottom: 20 },
    question: { marginBottom: 22, gap: 8 },
    question_text: { fontSize: 17, lineHeight: 24, fontFamily: FONTS.bold, color: COLORS.text },
    box: {
        minHeight: 110, padding: 14,
        borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.input,
        fontFamily: FONTS.regular, fontSize: 17, lineHeight: 23, color: COLORS.text, backgroundColor: COLORS.surface,
    },
    // only the color changes (see NumberInput)
    box_error: { borderColor: COLORS.error },
    error: { fontFamily: FONTS.regular, fontSize: 15, color: COLORS.error },
    bar: { flexDirection: "row" },
    skip: { flex: 1 },
    submit: { flex: 2 },
});
