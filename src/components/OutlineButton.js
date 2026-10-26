import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@react-native-vector-icons/ionicons";

import Gradient from "./Gradient.js";
import { CENTERED_TEXT, COLORS, FONTS, RADIUS as RADII } from "./theme.js";

const RING = 2;     // thickness of the gradient outline
const RADIUS = RADII.pill;

/**
 * The app's second-choice button: a white pill with a gradient outline, green (Skip, Duplicate, Replay tutorial)
 * or red for deleting. The outline is a gradient drawn behind the button and showing around its edge,
 * since a border can only be one color.
 *
 * @param {string} label
 * @param {Function} on_press
 * @param {string} icon - An Ionicons name to show before the label (optional).
 * @param {boolean} danger - Red, for buttons that delete something.
 * @param {boolean} compact - A little shorter with smaller text, for buttons inside cards or side by side.
 * @param {object} style - Extra styles for the outside, e.g. { flex: 1 } or a margin (optional).
 * @param {string} hint - Read out by screen readers after the label (optional).
 */
export default function OutlineButton({ label, on_press, icon, danger, compact, style, hint })
{
    const color = danger ? COLORS.error : COLORS.accent_text;

    return (
        <Pressable
            onPress={on_press}
            style={({ pressed }) => [styles.outer, pressed && styles.pressed, style]}
            accessibilityRole="button"
            accessibilityHint={hint}
        >
            <Gradient name={danger ? "outline_danger" : "outline"} style={styles.ring}>
                <View style={[styles.inner, compact && styles.inner_compact]}>
                    {icon ? <Ionicons name={icon} size={20} color={color} /> : null}
                    <Text style={[styles.text, compact && styles.text_compact, { color: color }]}>{label}</Text>
                </View>
            </Gradient>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    outer: { borderRadius: RADIUS },
    pressed: { opacity: 0.7 },
    // the gradient shows only in the RING-wide gap around the inner button
    ring: { borderRadius: RADIUS, padding: RING, overflow: "hidden" },
    // solid white inside, so the ring's gradient doesn't show through the glass
    inner: {
        minHeight: 54 - 2 * RING, paddingHorizontal: 18, borderRadius: RADIUS,
        flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.surface_solid,
    },
    inner_compact: { minHeight: 48 - 2 * RING },
    text: { fontSize: 17, fontFamily: FONTS.bold, textAlign: "center", ...CENTERED_TEXT },
    text_compact: { fontSize: 15 },
});
