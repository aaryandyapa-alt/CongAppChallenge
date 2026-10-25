import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@react-native-vector-icons/ionicons";

import { measures, SCENARIOS, TITLES } from "../lib/result_sentences.js";

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
                        <Ionicons name="chevron-forward" size={22} color="#555" />
                    </Pressable>
                );
            })}

            <Pressable style={styles.home} onPress={on_home} accessibilityRole="button">
                <Ionicons name="home-outline" size={20} color="#fff" />
                <Text style={styles.home_text}>Back to Home</Text>
            </Pressable>
        </>
    );
}

const styles = StyleSheet.create({
    title: { fontSize: 24, fontWeight: "700", color: "#1a1a1a", marginBottom: 8 },
    intro: { fontSize: 16, lineHeight: 22, color: "#444", marginBottom: 16 },
    row: {
        flexDirection: "row", alignItems: "center", gap: 12, minHeight: 72, padding: 14, marginBottom: 10,
        borderRadius: 10, borderWidth: 2, borderColor: "#c4c4c4", backgroundColor: "#fff",
    },
    row_text: { flex: 1, gap: 4 },
    row_title: { fontSize: 18, fontWeight: "600", color: "#1a1a1a" },
    row_value: { fontSize: 16, color: "#444" },
    same: { fontSize: 14, color: "#1d5fd1" },
    home: { marginTop: 16, minHeight: 52, borderRadius: 8, backgroundColor: "#1d5fd1", flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center" },
    home_text: { fontSize: 18, fontWeight: "600", color: "#fff" },
});
