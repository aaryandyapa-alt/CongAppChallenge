import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@react-native-vector-icons/ionicons";

import Gradient from "./Gradient.js";
import { CENTERED_TEXT, FONTS, RADIUS } from "./theme.js";
import { useTheme, useThemedStyles } from "./ThemeContext.js";

/**
 * The app's main button: a lime gradient pill with dark text and a soft lime glow underneath,
 * used for Next, Start, Submit, Continue and the like.
 * A disabled button is a flat pale lime with no glow instead, so it clearly looks unavailable.
 *
 * @param {string} label - The button's text.
 * @param {Function} on_press
 * @param {boolean} disabled - Greys it out and ignores taps.
 * @param {string} icon - An Ionicons name to show before the label (optional).
 * @param {object} style - Extra styles for the outside, e.g. { flex: 2 } or a margin (optional).
 * @param {string} hint - Read out by screen readers after the label (optional).
 */
export default function PrimaryButton({ label, on_press, disabled = false, icon, style, hint })
{
    const { COLORS, BUTTON_GLOW } = useTheme();
    const styles = useThemedStyles(make_styles);
    const content = (
        <>
            {icon ? <Ionicons name={icon} size={20} color={COLORS.on_accent} /> : null}
            <Text style={styles.text}>{label}</Text>
        </>
    );

    return (
        // the glow is on the outside and the gradient (clipped to the pill) inside, so the glow isn't cut off
        <Pressable
            onPress={on_press}
            disabled={disabled}
            style={({ pressed }) => [styles.outer, !disabled && BUTTON_GLOW, pressed && !disabled && styles.pressed, style]}
            accessibilityRole="button"
            accessibilityState={{ disabled: disabled }}
            accessibilityHint={hint}
        >
            {disabled
                ? <View style={[styles.inner, styles.disabled]}>{content}</View>
                : <Gradient name="button" style={styles.inner}>{content}</Gradient>}
        </Pressable>
    );
}

const make_styles = ({ COLORS }) => StyleSheet.create({
    outer: { borderRadius: RADIUS.pill },
    inner: {
        minHeight: 54, paddingHorizontal: 20, borderRadius: RADIUS.pill, overflow: "hidden",
        flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center",
    },
    disabled: { backgroundColor: COLORS.accent_disabled },
    // a slight dim and press-in while pressed, so taps feel responsive
    pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
    text: { fontSize: 17, fontFamily: FONTS.bold, color: COLORS.on_accent, ...CENTERED_TEXT },
});
