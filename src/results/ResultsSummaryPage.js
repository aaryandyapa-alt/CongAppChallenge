import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@react-native-vector-icons/ionicons";

import PrimaryButton from "../components/PrimaryButton.js";
import { measures, SCENARIOS, TITLES } from "../lib/result_sentences.js";
import { FONTS, RADIUS } from "../components/theme.js";
import { useTheme, useThemedStyles } from "../components/ThemeContext.js";

/**
 * The last results page: every setup side by side. The app never picks one for the user;
 * they tap the one that matters most to them to see it again.
 *
 * @param {object} output - The run's output.json.
 * @param {Function} on_jump - Called with a scenario's page index.
 * @param {Function} on_home - The Home button.
 */
export default function ResultsSummaryPage({ output, on_jump, on_home })
{
    const { COLORS } = useTheme();
    const styles = useThemedStyles(make_styles);
    const current = output["current"];

    return (
        <>
            <Text style={styles.title}>Compare the setups</Text>
            <Text style={styles.intro}>Each setup does best at something different. Tap the one that matters most to you to see how to split your workers.</Text>

            {SCENARIOS.map((key, i) =>
            {
                const scenario = output[key];
                const all = measures(scenario["metrics"]);
                // the current setup leads with its average wait; the others lead with the measure they're best at
                const shown = all[key === "current" ? "mean_wait" : key];
                const same_as_current = key !== "current" && scenario["workers"].every((w, j) => w === current["workers"][j]);
                return (
                    <Pressable
                        key={key}
                        style={styles.row}
                        onPress={() => on_jump(i)}
                        accessibilityRole="button"
                        accessibilityLabel={`${TITLES[key]}: ${shown.line}${same_as_current ? ", same as your current setup" : ""}`}
                    >
                        <View style={styles.row_text}>
                            <Text style={styles.row_title}>{TITLES[key]}</Text>
                            <Text style={styles.row_value}>{shown.line}</Text>
                            {same_as_current ? <Text style={styles.same}>Same as your current setup</Text> : null}
                        </View>
                        <View style={styles.chevron}>
                            <Ionicons name="chevron-forward" size={18} color={COLORS.accent_deep} />
                        </View>
                    </Pressable>
                );
            })}

            <PrimaryButton label="Back to Home" icon="home-outline" on_press={on_home} style={styles.home} />
        </>
    );
}

const make_styles = ({ COLORS, CARD_SHADOW }) => StyleSheet.create({
    title: { fontSize: 26, fontFamily: FONTS.extrabold, color: COLORS.text, marginBottom: 8, letterSpacing: -0.5, lineHeight: 32 },
    intro: { fontFamily: FONTS.regular, fontSize: 16, lineHeight: 23, color: COLORS.text_secondary, marginBottom: 18 },
    // glass cards
    row: {
        flexDirection: "row", alignItems: "center", gap: 12, minHeight: 76, paddingVertical: 14, paddingLeft: 18, paddingRight: 14, marginBottom: 12,
        borderRadius: RADIUS.card, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.glass_edge, ...CARD_SHADOW,
    },
    row_text: { flex: 1, gap: 4 },
    row_title: { fontSize: 17, fontFamily: FONTS.bold, color: COLORS.text },
    row_value: { fontFamily: FONTS.medium, fontSize: 15, color: COLORS.text_secondary },
    same: { fontFamily: FONTS.semibold, fontSize: 13, color: COLORS.accent_deep },
    // the arrow sits in a small lime circle, like Home's run rows
    chevron: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.accent_tint },
    home: { marginTop: 18 },
});
