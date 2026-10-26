import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import GlowBackground from "../components/GlowBackground.js";
import Gradient from "../components/Gradient.js";
import PrimaryButton from "../components/PrimaryButton.js";
import { BackButton } from "../components/RoundButton.js";
import TopBar from "../components/TopBar.js";
import { check_run_name } from "../lib/form_checks.js";
import { useKeyboardHeight } from "../lib/keyboard.js";
import { useDraftRun } from "../state/DraftRunContext.js";
import { list_runs } from "../storage.js";
import { CENTERED_TEXT, COLORS, EYEBROW, FONTS, RADIUS } from "../components/theme.js";

// the second mode is shown as "Advanced" but stored as "pro" (in the draft and run_info.json), so older saved runs still work
const MODES = [
    { value: "simple", label: "Simple (Recommended)", description: "Answer a few questions in your own words and we'll fill in the details for you to check." },
    { value: "pro", label: "Advanced", description: "Fill in every setting yourself, including the exact statistics." },
];
// space below Start, so it never sits right against the keyboard or the bottom of the screen
const PAGE_BOTTOM = 40;

/**
 * Names a new run and picks its mode.
 * Opened as /new-run?duplicate=1 from a saved run's Duplicate button: the draft is already filled
 * and keeps the original run's mode, so only the name is asked for.
 */
export default function NewRunScreen()
{
    const { duplicate } = useLocalSearchParams();
    const is_duplicate = duplicate === "1";
    const { draft, begin_run, set_name } = useDraftRun();

    const [name, set_name_text] = useState("");
    const [mode, set_mode] = useState("simple");
    // the name's error only shows once something is typed or Start is tapped
    const [show_error, set_show_error] = useState(false);
    // read once; saved runs can't change while this screen is open
    const [existing_names] = useState(() => list_runs());
    const keyboard_height = useKeyboardHeight();

    const name_error = check_run_name(name, existing_names);
    const selected_mode = MODES.find((m) => m.value === (is_duplicate ? draft?.mode : mode));

    function start()
    {
        if (name_error !== null)
        {
            set_show_error(true);
            return;
        }
        // spaces at the start or end are dropped, not rejected
        const final_name = name.trim();
        if (is_duplicate)
        {
            set_name(final_name);
            router.push("/intro");
        }
        else
        {
            begin_run(final_name, mode);
            router.push(mode === "simple" ? "/questions" : "/intro");
        }
    }

    return (
        // the keyboard opens straight away for the name; space the keyboard's height at the bottom keeps the rest
        // reachable by scrolling above it, even at large display and text sizes. The scroll view stays full height,
        // so nothing is cut off at its edge (a KeyboardAvoidingView here clipped the Start button)
        <View style={styles.screen}>
            <GlowBackground />
            <TopBar left={<BackButton />} eyebrow={is_duplicate ? "Duplicate run" : "New run"} title="Name this run" />
            <ScrollView
                contentContainerStyle={[styles.page, { paddingBottom: PAGE_BOTTOM + keyboard_height }]}
                keyboardShouldPersistTaps="handled"
            >
                <TextInput
                    style={[styles.name_box, show_error && name_error && styles.name_box_error]}
                    value={name}
                    onChangeText={(text) =>
                    {
                        set_name_text(text);
                        set_show_error(true);
                    }}
                    placeholder="For example: Saturday pantry"
                    autoFocus
                    autoCorrect={false}
                    maxLength={60}
                    returnKeyType="done"
                    accessibilityLabel="Run name"
                />
                {show_error && name_error ? <Text style={styles.error} accessibilityLiveRegion="polite">{name_error}</Text> : null}

                <Text style={styles.heading}>Mode</Text>
                {is_duplicate ? (
                    // a duplicate keeps the mode of the run it was copied from
                    <Text style={styles.fixed_mode}>{selected_mode?.label}, the same as the run you copied</Text>
                ) : (
                    <View style={styles.switch} accessibilityRole="radiogroup">
                        {MODES.map((m) =>
                        {
                            const selected = m.value === mode;
                            return (
                                <Pressable
                                    key={m.value}
                                    onPress={() => set_mode(m.value)}
                                    style={styles.option}
                                    accessibilityRole="radio"
                                    accessibilityState={{ checked: selected }}
                                >
                                    {/* the selected mode gets the lime gradient behind its label */}
                                    {selected ? <Gradient name="button" style={StyleSheet.absoluteFill} /> : null}
                                    <Text style={[styles.option_text, selected && styles.option_text_selected]}>{m.label}</Text>
                                </Pressable>
                            );
                        })}
                    </View>
                )}
                <Text style={styles.description}>{selected_mode?.description}</Text>

                <PrimaryButton label="Start" on_press={start} style={styles.start} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: COLORS.background },
    page: { paddingHorizontal: 20, paddingTop: 16, gap: 12 },
    // small uppercase section label
    heading: { ...EYEBROW, marginTop: 18, paddingHorizontal: 4 },
    name_box: {
        minHeight: 54, paddingHorizontal: 16,
        borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.input,
        fontFamily: FONTS.regular, fontSize: 18, color: COLORS.text, backgroundColor: COLORS.surface,
    },
    // same width as normal so the box doesn't change while typing (see NumberInput)
    name_box_error: { borderColor: COLORS.error },
    error: { fontFamily: FONTS.regular, fontSize: 15, color: COLORS.error },
    // a pill-shaped segmented control: the chosen mode is a lime pill inside a softly tinted track
    switch: { flexDirection: "row", padding: 5, borderRadius: RADIUS.pill, backgroundColor: COLORS.segment_track },
    option: {
        flex: 1, minHeight: 50, alignItems: "center", justifyContent: "center", paddingHorizontal: 8,
        borderRadius: RADIUS.pill, overflow: "hidden",
    },
    option_text: { fontFamily: FONTS.semibold, fontSize: 15, color: COLORS.text_muted, textAlign: "center", ...CENTERED_TEXT },
    option_text_selected: { color: COLORS.on_accent, fontFamily: FONTS.bold },
    fixed_mode: { fontFamily: FONTS.regular, fontSize: 17, color: COLORS.text },
    description: { fontFamily: FONTS.regular, fontSize: 16, color: COLORS.text_muted, lineHeight: 22 },
    start: { marginTop: 24 },
});
