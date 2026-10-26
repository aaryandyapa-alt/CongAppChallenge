import { createContext } from "react";
import { StyleSheet, Text, View } from "react-native";
import { FONTS } from "./theme.js";
import { useThemedStyles } from "./ThemeContext.js";

/**
 * Lets the input inside a StarredField know it's starred, so it can color its own box amber
 * (NumberInput, TimeInput and LevelPicker read it with useContext).
 */
// The inputs color themselves with STARRED_BOX from the theme (useTheme); a field with a problem shows red instead.
export const StarredContext = createContext(false);

/**
 * Wraps one input with its label, a star, and its error message.
 * It only shows the star; when a star appears or clears is decided in state/DraftRunContext.js.
 *
 * @param {string} label - The question shown above the input.
 * @param {boolean} starred - The AI couldn't fill this field, so it holds a default value.
 * @param {string|null} error - A message from check_form, or null.
 * @param {*} children - The input itself.
 */
export default function StarredField({ label, starred = false, error = null, children })
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
            <StarredContext value={starred}>{children}</StarredContext>
            {error ? <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text> : null}
        </View>
    );
}

const make_styles = ({ COLORS }) => StyleSheet.create({
    field: { gap: 8, marginBottom: 20 },
    label_row: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
    label: { fontFamily: FONTS.semibold, fontSize: 16, lineHeight: 22, color: COLORS.text, flexShrink: 1 },
    star: { fontFamily: FONTS.regular, fontSize: 18, color: COLORS.starred },
    error: { fontFamily: FONTS.regular, fontSize: 15, color: COLORS.error },
});
