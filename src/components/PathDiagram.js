import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@react-native-vector-icons/ionicons";

/**
 * The path every person takes: stations as boxes, top to bottom in visiting order, joined by arrows.
 * Callers turn their own data into the list below, so the review Summary and the results pages can both use it.
 * It doesn't scroll by itself; put it inside the page's ScrollView.
 *
 * @param {{name: string, workers: number, minutes: number, variance: string}[]} stations -
 *     workers is 0 for a customer-led station; variance is the text to show, like "Varies some".
 */
export default function PathDiagram({ stations })
{
    return (
        <View style={styles.column}>
            {stations.map((s, i) => (
                <View key={i} style={styles.step}>
                    {i > 0 ? <Ionicons name="arrow-down" size={22} color="#555" style={styles.arrow} /> : null}
                    <View
                        style={styles.box}
                        accessible
                        accessibilityLabel={`Station ${i + 1}, ${s.name}: ${worker_text(s.workers)}, ${s.minutes} minutes, ${s.variance}`}
                    >
                        <Text style={styles.name}>{i + 1}. {s.name}</Text>
                        <Text style={styles.detail}>{worker_text(s.workers)}  ·  {s.minutes} mins  ·  {s.variance}</Text>
                    </View>
                </View>
            ))}
        </View>
    );
}

function worker_text(workers)
{
    if (workers === 0)
        return "Customer-led";
    return workers === 1 ? "1 worker" : `${workers} workers`;
}

const styles = StyleSheet.create({
    column: { paddingVertical: 8 },
    step: { alignItems: "stretch" },
    arrow: { alignSelf: "center", marginVertical: 4 },
    box: { minHeight: 100, paddingHorizontal: 16, paddingVertical: 22, gap: 8, justifyContent: "center", borderWidth: 2, borderColor: "#1d5fd1", borderRadius: 8, backgroundColor: "#fff" },
    name: { fontSize: 17, fontWeight: "600", color: "#1a1a1a" },
    detail: { fontSize: 15, color: "#444" },
});
