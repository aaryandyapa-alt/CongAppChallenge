import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { FONTS, RADIUS } from "./theme.js";
import { useTheme, useThemedStyles } from "./ThemeContext.js";

/**
 * The small line at the top of each field page on runs the AI filled in, reminding the user to check the values.
 * review.js decides when to show it (only when draft.start_state is "ai-full" or "ai-partial").
 */
export default function AiReminder()
{
    const { COLORS } = useTheme();
    const styles = useThemedStyles(make_styles);
    return (
        <View style={styles.row} accessible accessibilityLabel="These values were filled in by AI from your answers. Please check them.">
            <Ionicons name="sparkles-outline" size={16} color={COLORS.accent_deep} />
            <Text style={styles.text}>Filled in by AI from your answers. Please check them.</Text>
        </View>
    );
}

const make_styles = ({ COLORS }) => StyleSheet.create({
    // a soft lime chip
    row: {
        flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start", marginBottom: 16,
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.pill, backgroundColor: COLORS.accent_tint,
    },
    text: { flexShrink: 1, fontFamily: FONTS.italic, fontSize: 14, color: COLORS.text_muted },
});
