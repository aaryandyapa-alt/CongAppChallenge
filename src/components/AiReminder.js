import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { CONTACT_EMAIL, email_team } from "../lib/links.js";
import { CENTERED_TEXT, FONTS, RADIUS } from "./theme.js";
import { useTheme, useThemedStyles } from "./ThemeContext.js";

/**
 * The small line at the top of each field page on runs the AI filled in, reminding the user to check the values,
 * with a "Report a problem" link that emails the team about anything wrong or inappropriate the AI produced
 * (Google Play asks apps that generate content with AI to let users report it from inside the app).
 * review.js decides when to show it (only when draft.start_state is "ai-full" or "ai-partial").
 */
export default function AiReminder()
{
    const { COLORS } = useTheme();
    const styles = useThemedStyles(make_styles);
    // shown if the phone has no email app to open
    const [no_email_app, set_no_email_app] = useState(false);

    async function report()
    {
        const opened = await email_team("Problem with ShiftLime's AI", "What did the AI get wrong or fill in badly?\n\n");
        set_no_email_app(!opened);
    }

    return (
        <View style={styles.wrap}>
            <View style={styles.row} accessible accessibilityLabel="These values were filled in by AI from your answers. Please check them.">
                <Ionicons name="sparkles-outline" size={16} color={COLORS.accent_deep} />
                <Text style={styles.text}>Filled in by AI from your answers. Please check them.</Text>
            </View>
            <Pressable
                onPress={report}
                hitSlop={8}
                style={styles.report}
                accessibilityRole="link"
                accessibilityHint="Opens an email to the ShiftLime team"
            >
                <Ionicons name="flag-outline" size={14} color={COLORS.accent_deep} />
                <Text style={styles.report_text}>Report a problem with the AI</Text>
            </Pressable>
            {no_email_app ? (
                <Text style={styles.fallback} accessibilityLiveRegion="polite" selectable>Email us at {CONTACT_EMAIL}</Text>
            ) : null}
        </View>
    );
}

const make_styles = ({ COLORS }) => StyleSheet.create({
    wrap: { alignItems: "flex-start", gap: 6, marginBottom: 16 },
    // a soft lime chip
    row: {
        flexDirection: "row", alignItems: "center", gap: 8,
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.pill, backgroundColor: COLORS.accent_tint,
    },
    text: { flexShrink: 1, fontFamily: FONTS.italic, fontSize: 14, color: COLORS.text_muted, ...CENTERED_TEXT },
    // a small link under the chip, finger-sized through its hit slop
    report: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 6, paddingVertical: 2 },
    report_text: { fontFamily: FONTS.semibold, fontSize: 13, color: COLORS.accent_deep, textDecorationLine: "underline" },
    fallback: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.text_muted, paddingHorizontal: 6 },
});
