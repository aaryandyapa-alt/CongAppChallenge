import { StyleSheet, Text, View } from "react-native";

import { VARIANCE_OPTIONS } from "../components/LevelPicker.js";
import PathDiagram from "../components/PathDiagram.js";
import { format_time } from "../components/TimeInput.js";
import { total_workers } from "../lib/form_to_schema.js";

// blank fields show as a dash; they're also flagged on their own pages
const or_dash = (v) => v === null || v === undefined || v === "" || Number.isNaN(v) ? "–" : v;

/**
 * The run at a glance before simulating: hours, arrivals, and the path through the stations.
 * The Start simulation button is in review.js's bottom bar.
 */
export default function SummaryPage({ draft, errors, station_count })
{
    const { basics, arrivals, stations } = draft.form;
    const pro = draft.mode === "pro";
    const problem_count = Object.keys(errors).length;
    const total = total_workers(draft.form);

    const diagram = stations.slice(0, station_count).map((s) => ({
        name: or_dash(s.name),
        workers: s.customer_led ? 0 : or_dash(s.workers),
        minutes: or_dash(s.minutes),
        variance: pro
            ? (s.distribution === "lognormal" ? `Lognormal, SD ${or_dash(s.stddev)} mins` : "Exponential")
            : or_dash(VARIANCE_OPTIONS.find((o) => o.value === s.variance_level)?.label),
    }));

    return (
        <>
            <View style={styles.facts}>
                <Text style={styles.fact}>Open {or_dash(format_time(basics.open_time))} to {or_dash(format_time(basics.close_time))}</Text>
                <Text style={styles.fact}>{total === 1 ? "1 worker" : `${or_dash(total)} workers`} in total</Text>
                <Text style={styles.fact}>About {or_dash(arrivals.per_hour)} arrivals per hour</Text>
                {arrivals.type === "bursty" ? (
                    <Text style={styles.fact}>Busiest around {or_dash(format_time(arrivals.peak_time))}</Text>
                ) : (
                    <Text style={styles.fact}>Arrival rate is about the same all day</Text>
                )}
            </View>

            <Text style={styles.heading}>The path each person takes</Text>
            <PathDiagram stations={diagram} />

            {problem_count > 0 ? (
                <Text style={styles.problems} accessibilityLiveRegion="polite">
                    {problem_count === 1 ? "1 thing needs" : `${problem_count} things need`} fixing before you can simulate. Tap a red circle at the top to go to it.
                </Text>
            ) : null}
        </>
    );
}

const styles = StyleSheet.create({
    facts: { gap: 6, marginBottom: 20 },
    fact: { fontSize: 18, color: "#1a1a1a" },
    heading: { fontSize: 17, fontWeight: "600", color: "#1a1a1a" },
    problems: { marginTop: 20, fontSize: 16, color: "#b3261e" },
});
