import { StyleSheet, Text, View } from "react-native";

import PathDiagram, { variance_text } from "../components/PathDiagram.js";
import { BALANCE_EXPLAINED, compared_with_current, measures, scenario_sentence, TITLES } from "../lib/result_sentences.js";
import { FONTS, RADIUS } from "../components/theme.js";
import { useThemedStyles } from "../components/ThemeContext.js";

/**
 * One results page: the current setup, or the setup that does best on one measure.
 *
 * @param {string} scenario_key - "current", "mean_wait", "p90_wait" or "balance".
 * @param {object} output - The run's output.json.
 * @param {object} form - The run's input as a form (schema_to_form), for station names, minutes and variance.
 * @param {boolean} pro - The run was made in Pro mode.
 */
export default function ScenarioPage({ scenario_key, output, form, pro })
{
    const styles = useThemedStyles(make_styles);
    const scenario = output[scenario_key];
    const current = output["current"];
    const all = measures(scenario["metrics"]);
    // the current setup leads with its average wait; the others lead with the measure they're best at
    const headline_key = scenario_key === "current" ? "mean_wait" : scenario_key;
    const others = Object.keys(all).filter((k) => k !== headline_key);

    const diagram = form.stations.map((s, i) => ({
        name: s.name,
        workers: scenario["workers"][i],
        minutes: s.minutes,
        variance: variance_text(s, pro),
        change: scenario_key === "current" ? 0 : scenario["workers"][i] - current["workers"][i],
        // missing in runs saved before utilization was added; PathDiagram then leaves the line out
        busy: scenario["metrics"]["utilization"]?.[i] ?? undefined,
    }));

    return (
        <>
            <Text style={styles.title}>{TITLES[scenario_key]}</Text>

            <View style={styles.headline} accessible>
                <Text style={styles.headline_label}>{all[headline_key].label}</Text>
                <Text style={styles.headline_value}>{all[headline_key].value}</Text>
                {scenario_key !== "current" ? (
                    <Text style={styles.compared}>
                        {compared_with_current(headline_key, scenario["metrics"][headline_key], current["metrics"][headline_key])}
                    </Text>
                ) : null}
            </View>

            <Text style={styles.sentence}>{scenario_sentence(scenario_key, scenario, current)}</Text>

            <View style={styles.others}>
                {others.map((k, i) => (
                    <View key={k} style={[styles.other, i > 0 && styles.other_divided]} accessible>
                        <Text style={styles.other_label}>{all[k].label}</Text>
                        <Text style={styles.other_value}>{all[k].value}</Text>
                    </View>
                ))}
            </View>
            <Text style={styles.note}>{BALANCE_EXPLAINED}</Text>

            <Text style={styles.heading}>{scenario_key === "current" ? "How your workers are split now" : "How to split your workers"}</Text>
            <PathDiagram stations={diagram} />
        </>
    );
}

const make_styles = ({ COLORS, EYEBROW, CARD_SHADOW }) => StyleSheet.create({
    title: { fontSize: 26, fontFamily: FONTS.extrabold, color: COLORS.text, marginBottom: 16, letterSpacing: -0.5, lineHeight: 32 },
    // the big glass panel with the headline number
    headline: {
        padding: 22, gap: 6, marginBottom: 18, borderRadius: RADIUS.panel,
        backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.glass_edge, ...CARD_SHADOW,
    },
    headline_label: { ...EYEBROW },
    headline_value: { fontSize: 40, fontFamily: FONTS.extrabold, color: COLORS.text, letterSpacing: -1 },
    // "down from 6.8 min" as a soft lime chip
    compared: {
        alignSelf: "flex-start", marginTop: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.pill, overflow: "hidden",
        fontSize: 14, fontFamily: FONTS.bold, color: COLORS.accent_deep, backgroundColor: COLORS.accent_tint,
    },
    sentence: { fontFamily: FONTS.regular, fontSize: 17, lineHeight: 25, color: COLORS.text, marginBottom: 18 },
    // the other two measures, on one glass card
    others: {
        paddingHorizontal: 18, paddingVertical: 4, borderRadius: RADIUS.card,
        backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.glass_edge, ...CARD_SHADOW,
    },
    other: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: 12, paddingVertical: 12 },
    other_divided: { borderTopWidth: 1, borderTopColor: COLORS.divider },
    other_label: { fontFamily: FONTS.medium, fontSize: 15, color: COLORS.text_secondary, flexShrink: 1 },
    other_value: { fontSize: 18, fontFamily: FONTS.bold, color: COLORS.text },
    note: { fontFamily: FONTS.regular, fontSize: 13, lineHeight: 19, color: COLORS.text_faint, marginTop: 10, marginBottom: 24, paddingHorizontal: 4 },
    heading: { ...EYEBROW, marginBottom: 4, paddingHorizontal: 4 },
});
