import { StyleSheet, Text, View } from "react-native";

import PathDiagram, { variance_text } from "../components/PathDiagram.js";
import { BALANCE_EXPLAINED, compared_with_current, measures, scenario_sentence, TITLES } from "../lib/result_sentences.js";
import { COLORS } from "../components/theme.js";

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

            {others.map((k) => (
                <View key={k} style={styles.other} accessible>
                    <Text style={styles.other_label}>{all[k].label}</Text>
                    <Text style={styles.other_value}>{all[k].value}</Text>
                </View>
            ))}
            <Text style={styles.note}>{BALANCE_EXPLAINED}</Text>

            <Text style={styles.heading}>{scenario_key === "current" ? "How your workers are split now" : "How to split your workers"}</Text>
            <PathDiagram stations={diagram} />
        </>
    );
}

const styles = StyleSheet.create({
    title: { fontSize: 24, fontWeight: "700", color: COLORS.text, marginBottom: 16 },
    headline: { padding: 18, borderRadius: 10, backgroundColor: COLORS.surface, borderWidth: 2, borderColor: COLORS.accent, gap: 4, marginBottom: 16 },
    headline_label: { fontSize: 16, color: COLORS.text_secondary },
    headline_value: { fontSize: 34, fontWeight: "700", color: COLORS.text },
    compared: { fontSize: 16, color: COLORS.accent, fontWeight: "600" },
    sentence: { fontSize: 17, lineHeight: 24, color: COLORS.text, marginBottom: 16 },
    other: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: COLORS.divider },
    other_label: { fontSize: 16, color: COLORS.text_secondary, flexShrink: 1 },
    other_value: { fontSize: 18, fontWeight: "600", color: COLORS.text },
    note: { fontSize: 14, lineHeight: 20, color: COLORS.text_faint, marginTop: 4, marginBottom: 20 },
    heading: { fontSize: 17, fontWeight: "600", color: COLORS.text },
});
