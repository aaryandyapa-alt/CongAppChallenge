import { router, useLocalSearchParams } from "expo-router";
import { useHeaderHeight } from "expo-router/react-navigation";
import { useState } from "react";
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { check_run_name } from "../lib/form_checks.js";
import { useDraftRun } from "../state/DraftRunContext.js";
import { list_runs } from "../storage.js";
import { COLORS } from "../components/theme.js";

// the second mode is shown as "Advanced" but stored as "pro" (in the draft and run_info.json), so older saved runs still work
const MODES = [
    { value: "simple", label: "Simple (Recommended)", description: "Answer a few questions in your own words and we'll fill in the details for you to check." },
    { value: "pro", label: "Advanced", description: "Fill in every setting yourself, including the exact statistics." },
];

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
    const header_height = useHeaderHeight();

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
        // the keyboard opens straight away for the name; this keeps the rest reachable by scrolling above it,
        // even at large display and text sizes (see review.js)
        <KeyboardAvoidingView style={styles.screen} behavior="padding" keyboardVerticalOffset={header_height}>
            <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
                <Text style={styles.heading}>Name this run</Text>
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
                                    style={[styles.option, selected && styles.option_selected]}
                                    accessibilityRole="radio"
                                    accessibilityState={{ checked: selected }}
                                >
                                    <Text style={[styles.option_text, selected && styles.option_text_selected]}>{m.label}</Text>
                                </Pressable>
                            );
                        })}
                    </View>
                )}
                <Text style={styles.description}>{selected_mode?.description}</Text>

                <Pressable style={styles.start} onPress={start} accessibilityRole="button">
                    <Text style={styles.start_text}>Start</Text>
                </Pressable>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: COLORS.background },
    // extra space at the bottom so Start never sits right against the keyboard
    page: { padding: 20, paddingBottom: 40, gap: 12 },
    heading: { fontSize: 20, fontWeight: "600", color: COLORS.text, marginTop: 12 },
    name_box: {
        minHeight: 52, paddingHorizontal: 14,
        borderWidth: 2, borderColor: COLORS.border, borderRadius: 8,
        fontSize: 18, color: COLORS.text, backgroundColor: COLORS.surface,
    },
    // same width as normal so the box doesn't change while typing (see NumberInput)
    name_box_error: { borderColor: COLORS.error },
    error: { fontSize: 15, color: COLORS.error },
    switch: { flexDirection: "row", borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, overflow: "hidden" },
    option: { flex: 1, minHeight: 52, alignItems: "center", justifyContent: "center", paddingHorizontal: 8, backgroundColor: COLORS.surface },
    option_selected: { backgroundColor: COLORS.accent },
    option_text: { fontSize: 16, color: COLORS.text, textAlign: "center" },
    option_text_selected: { color: COLORS.on_accent, fontWeight: "600" },
    fixed_mode: { fontSize: 17, color: COLORS.text },
    description: { fontSize: 16, color: COLORS.text_muted, lineHeight: 22 },
    start: { marginTop: 24, minHeight: 52, borderRadius: 8, backgroundColor: COLORS.accent, alignItems: "center", justifyContent: "center" },
    start_text: { fontSize: 18, fontWeight: "600", color: COLORS.on_accent },
});
