import { router } from "expo-router";
import { Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useTheme, useThemedStyles } from "./ThemeContext.js";

const SIZE = 44;

/**
 * A round icon button for the top corners of a screen (back, home), in place of a header bar.
 *
 * @param {string} icon - An Ionicons name.
 * @param {Function} on_press
 * @param {string} label - What a screen reader says.
 * @param {string} hint - A longer screen reader explanation (optional).
 */
export default function RoundButton({ icon, on_press, label, hint })
{
    const { COLORS } = useTheme();
    const styles = useThemedStyles(make_styles);
    return (
        <Pressable
            onPress={on_press}
            hitSlop={6}
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityHint={hint}
        >
            <Ionicons name={icon} size={24} color={COLORS.accent_text} />
        </Pressable>
    );
}

/**
 * The back arrow: the same as the phone's back button or swipe (screens that block going back still get to catch it).
 */
export function BackButton()
{
    return <RoundButton icon="arrow-back" on_press={() => router.back()} label="Back" />;
}

const make_styles = ({ COLORS, CARD_SHADOW }) => StyleSheet.create({
    // a frosted glass circle with a bright edge
    button: {
        width: SIZE, height: SIZE, borderRadius: SIZE / 2, alignItems: "center", justifyContent: "center",
        backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.glass_edge, ...CARD_SHADOW,
    },
    pressed: { opacity: 0.7 },
});
