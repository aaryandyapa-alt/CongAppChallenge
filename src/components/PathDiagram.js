import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@react-native-vector-icons/ionicons";

import { VARIANCE_OPTIONS } from "./LevelPicker.js";
import { CARD_SHADOW, COLORS, FONTS, RADIUS } from "./theme.js";

/**
 * The path every person takes: stations as boxes, top to bottom in visiting order, joined by arrows.
 * Callers turn their own data into the list below, so the review Summary and the results pages can both use it.
 * It doesn't scroll by itself; put it inside the page's ScrollView.
 *
 * @param {{name: string, workers: number, minutes: number, variance: string, change?: number, busy?: number}[]} stations -
 *     workers is 0 for a customer-led station; variance is the text to show, like "Varies some";
 *     change (optional) is how many workers this station gained or lost compared with the current setup;
 *     busy (optional, 0 to 1) is the share of the time its workers spent serving, from the simulation's utilization.
 */
export default function PathDiagram({ stations })
{
    return (
        <View style={styles.column}>
            {stations.map((s, i) => (
                <View key={i} style={styles.step}>
                    {i > 0 ? <Ionicons name="arrow-down" size={22} color={COLORS.accent_text} style={styles.arrow} /> : null}
                    <View
                        style={[styles.box, s.change ? styles.box_changed : null]}
                        accessible
                        accessibilityLabel={`Station ${i + 1}, ${s.name}: ${worker_text(s.workers)}${change_text(s.change, true)}, ${s.minutes} minutes, ${s.variance}${has_busy(s) ? `, ${busy_text(s.busy)}` : ""}`}
                    >
                        <Text style={styles.name}>{i + 1}. {s.name}</Text>
                        <Text style={styles.detail}>
                            {worker_text(s.workers)}
                            {s.change ? <Text style={styles.change}>{change_text(s.change, false)}</Text> : null}
                            {"  ·  "}{s.minutes} mins  ·  {s.variance}
                        </Text>
                        {has_busy(s) ? <Text style={styles.detail}>{busy_text(s.busy)}</Text> : null}
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

// only staffed stations with a simulated value; customer-led stations and runs saved before utilization existed have none
const has_busy = (s) => typeof s.busy === "number" && s.workers > 0;

// "Busy 82% of the time"
function busy_text(busy)
{
    const percent = Math.round(busy * 100);
    return `Busy ${percent < 1 ? "under 1" : percent}% of the time`;
}

// " (+1)" on screen, or ", 1 more than now" for screen readers
function change_text(change, spoken)
{
    if (!change)
        return "";
    if (spoken)
        return `, ${Math.abs(change)} ${change > 0 ? "more" : "fewer"} than now`;
    return ` (${change > 0 ? "+" : "−"}${Math.abs(change)})`;
}

/**
 * The variance text for a station box, from a form station (see lib/form_to_schema.js).
 * Simple shows the plain level; Pro shows the distribution.
 */
export function variance_text(station, pro)
{
    if (pro)
        return station.distribution === "lognormal" ? `Lognormal, SD ${station.stddev ?? "–"} mins` : "Exponential";
    return VARIANCE_OPTIONS.find((o) => o.value === station.variance_level)?.label ?? "–";
}

const styles = StyleSheet.create({
    column: { paddingVertical: 8 },
    step: { alignItems: "stretch" },
    arrow: { alignSelf: "center", marginVertical: 4 },
    // glass cards
    box: {
        minHeight: 100, paddingHorizontal: 18, paddingVertical: 20, gap: 8, justifyContent: "center", borderRadius: RADIUS.card,
        backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.glass_edge, ...CARD_SHADOW,
    },
    // stations whose workers changed get a soft lime tint and a lime edge so they stand out
    box_changed: { backgroundColor: COLORS.accent_light, borderColor: COLORS.accent },
    name: { fontSize: 17, fontFamily: FONTS.bold, color: COLORS.text },
    detail: { fontFamily: FONTS.regular, fontSize: 15, color: COLORS.text_secondary },
    // charcoal, not green: green text is too faint on the changed box's green tint (4.3:1)
    change: { fontFamily: FONTS.bold, color: COLORS.text },
});
