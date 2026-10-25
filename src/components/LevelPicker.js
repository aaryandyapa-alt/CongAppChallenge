import { useContext, useState } from "react";
import { Modal, Pressable, StyleSheet, Text } from "react-native";
import { Ionicons } from "@react-native-vector-icons/ionicons";

import { STARRED_BOX, StarredContext } from "./StarredField.js";
import { COLORS } from "./theme.js";

// Simple mode wording; never statistical terms
export const VARIANCE_OPTIONS = [
    { value: "low", label: "Pretty consistent" },
    { value: "medium", label: "Varies some" },
    { value: "high", label: "Varies a lot" },
];
export const BURST_OPTIONS = [
    { value: "low", label: "A little busier" },
    { value: "medium", label: "Noticeably busier" },
    { value: "high", label: "Much busier" },
];

/**
 * A dropdown. Made for Low / Medium / High, but takes any list of options
 * (the review pages also use it for arrival type and station type).
 *
 * @param {string|null} value - The selected option's value, or null for none.
 * @param {Function} on_change - Called with the chosen option's value.
 * @param {{value: string, label: string}[]} options
 * @param {boolean} has_error - Outlines the box in red.
 * @param {string} label - What's being chosen, like "Time spent varies". Read out by screen readers and shown as the list's title.
 */
export default function LevelPicker({ value, on_change, options, has_error = false, label })
{
    const [open, set_open] = useState(false);
    const selected = options.find((o) => o.value === value);
    // amber box when the AI couldn't fill this field (red wins if there's also a problem)
    const starred = useContext(StarredContext);

    function choose(option_value)
    {
        set_open(false);
        on_change(option_value);
    }

    return (
        <>
            <Pressable
                onPress={() => set_open(true)}
                style={[styles.box, starred && STARRED_BOX, has_error && styles.box_error]}
                accessibilityRole="button"
                accessibilityLabel={`${label}: ${selected ? selected.label : "not chosen"}`}
                accessibilityHint="Opens a list to choose from"
            >
                <Text style={[styles.box_text, !selected && styles.placeholder]}>{selected ? selected.label : "Choose…"}</Text>
                <Ionicons name="chevron-down" size={18} color={COLORS.text_muted} />
            </Pressable>

            <Modal visible={open} transparent animationType="fade" onRequestClose={() => set_open(false)}>
                {/* tapping outside the list closes it */}
                <Pressable style={styles.backdrop} onPress={() => set_open(false)} accessibilityLabel="Close">
                    {/* catches taps on the list's own background so they don't close it */}
                    <Pressable style={styles.sheet} onPress={() => {}} accessible={false}>
                        <Text style={styles.title}>{label}</Text>
                        {options.map((o) =>
                        {
                            const is_selected = o.value === value;
                            return (
                                <Pressable
                                    key={o.value}
                                    onPress={() => choose(o.value)}
                                    style={[styles.option, is_selected && styles.option_selected]}
                                    accessibilityRole="button"
                                    accessibilityState={{ selected: is_selected }}
                                >
                                    <Text style={styles.option_text}>{o.label}</Text>
                                    {is_selected ? <Ionicons name="checkmark" size={20} color={COLORS.accent} /> : null}
                                </Pressable>
                            );
                        })}
                    </Pressable>
                </Pressable>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    box: {
        minHeight: 48, minWidth: 180, paddingHorizontal: 12, gap: 8,
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        borderWidth: 2, borderColor: COLORS.border, borderRadius: 8, backgroundColor: COLORS.surface,
    },
    box_error: { borderColor: COLORS.error },
    box_text: { fontSize: 17, color: COLORS.text },
    placeholder: { color: COLORS.placeholder },
    backdrop: { flex: 1, backgroundColor: COLORS.backdrop, justifyContent: "center", padding: 24 },
    sheet: { backgroundColor: COLORS.surface, borderRadius: 12, paddingVertical: 8 },
    title: { fontSize: 16, fontWeight: "600", color: COLORS.text_muted, paddingHorizontal: 16, paddingVertical: 12 },
    option: { minHeight: 52, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    option_selected: { backgroundColor: COLORS.accent_light },
    option_text: { fontSize: 18, color: COLORS.text },
});
