import { createContext } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { FONTS, RADIUS } from "./theme.js";
import { useTheme, useThemedStyles } from "./ThemeContext.js";

/**
 * Lets the input inside a StarredField know it's starred, so it can color its own box amber
 * (NumberInput, TimeInput and LevelPicker read it with useContext).
 */
// The inputs color themselves with STARRED_BOX from the theme (useTheme); a field with a problem shows red instead.
export const StarredContext = createContext(false);

/**
 * A speech bubble with an arrow pointing down at the input below it: the sample run's practice explanations
 * (lib/sample_run.js). Amber for a guess to check, red for something to fix.
 */
function Hint({ hint })
{
    const { COLORS } = useTheme();
    const styles = useThemedStyles(make_styles);
    const red = hint.kind === "red";

    return (
        <View style={styles.hint_wrap} accessibilityRole="text" accessibilityLiveRegion="polite">
            <View style={[styles.hint, red ? styles.hint_red : styles.hint_amber]}>
                <Ionicons name={red ? "alert-circle" : "bulb-outline"} size={18} color={red ? COLORS.error : COLORS.warning_text} />
                <Text style={[styles.hint_text, red ? styles.hint_text_red : styles.hint_text_amber]}>{hint.text}</Text>
            </View>
            {/* the arrow: a small square turned 45 degrees, half tucked under the bubble so only its point shows */}
            <View style={[styles.arrow, red ? styles.hint_red : styles.hint_amber]} />
        </View>
    );
}

/**
 * Wraps one input with its label, a star, its error message, and (in the sample run) a practice callout.
 * It only shows the star; when a star appears or clears is decided in state/DraftRunContext.js.
 *
 * @param {string} label - The question shown above the input.
 * @param {boolean} starred - The AI couldn't fill this field, so it holds a default value.
 * @param {string|null} error - A message from check_form, or null.
 * @param {{kind: string, text: string}|null} hint - A practice callout (sample run only), or null.
 * @param {*} children - The input itself.
 */
export default function StarredField({ label, starred = false, error = null, hint = null, children })
{
    const styles = useThemedStyles(make_styles);
    return (
        <View style={styles.field}>
            <View style={styles.label_row}>
                <Text style={styles.label}>{label}</Text>
                {starred ? (
                    <Text
                        style={styles.star}
                        accessibilityLabel="The AI couldn't fill this, so a default value was used. Please check it."
                    >
                        ★
                    </Text>
                ) : null}
            </View>
            {hint ? <Hint hint={hint} /> : null}
            <StarredContext value={starred}>{children}</StarredContext>
            {error ? <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text> : null}
        </View>
    );
}

const ARROW = 12;

const make_styles = ({ COLORS }) => StyleSheet.create({
    field: { gap: 8, marginBottom: 20 },
    label_row: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
    label: { fontFamily: FONTS.semibold, fontSize: 16, lineHeight: 22, color: COLORS.text, flexShrink: 1 },
    star: { fontFamily: FONTS.regular, fontSize: 18, color: COLORS.starred },
    error: { fontFamily: FONTS.regular, fontSize: 15, color: COLORS.error },
    // room under the bubble for its arrow
    hint_wrap: { marginBottom: ARROW / 2 },
    hint: {
        flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 12,
        borderRadius: RADIUS.input, borderWidth: 1.5, zIndex: 1,
    },
    hint_amber: { backgroundColor: COLORS.starred_light, borderColor: COLORS.starred },
    hint_red: { backgroundColor: COLORS.error_light, borderColor: COLORS.error },
    hint_text: { flex: 1, fontFamily: FONTS.medium, fontSize: 14, lineHeight: 20 },
    hint_text_amber: { color: COLORS.warning_text },
    hint_text_red: { color: COLORS.error },
    // under the bubble's bottom-left, pointing down at the input; only the bottom and right edges are drawn,
    // which after turning make the point
    arrow: {
        position: "absolute", left: 22, bottom: -ARROW / 2 + 1, width: ARROW, height: ARROW,
        borderTopWidth: 0, borderLeftWidth: 0, borderRightWidth: 1.5, borderBottomWidth: 1.5,
        transform: [{ rotate: "45deg" }], zIndex: 2,
    },
});
