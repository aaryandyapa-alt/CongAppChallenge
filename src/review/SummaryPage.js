import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@react-native-vector-icons/ionicons";

import PathDiagram, { variance_text } from "../components/PathDiagram.js";
import { format_time } from "../components/TimeInput.js";
import { check_overload } from "../lib/form_checks.js";
import { total_workers } from "../lib/form_to_schema.js";
import { CARD_SHADOW, COLORS, EYEBROW, FONTS, RADIUS } from "../components/theme.js";

// "about 20", or "fewer than 1" for tiny rates
function about(rate)
{
    return rate < 1 ? "fewer than 1" : `about ${Math.round(rate)}`;
}

// blank fields show as a dash; they're also flagged on their own pages
const or_dash = (v) => v === null || v === undefined || v === "" || Number.isNaN(v) ? "–" : v;

// one line of the facts card
function Fact({ icon, text })
{
    return (
        <View style={styles.fact_row}>
            <View style={styles.fact_icon}>
                <Ionicons name={icon} size={18} color={COLORS.accent_deep} />
            </View>
            <Text style={styles.fact}>{text}</Text>
        </View>
    );
}

/**
 * The run at a glance before simulating: hours, arrivals, and the path through the stations.
 * The Start simulation button is in review.js's bottom bar.
 * The saved-run screen reuses this with saved = true, which leaves out the warning about the simulation to come.
 */
export default function SummaryPage({ draft, errors, station_count, saved = false })
{
    const { basics, arrivals, stations } = draft.form;
    const pro = draft.mode === "pro";
    const problem_count = Object.keys(errors).length;
    const total = total_workers(draft.form);
    const overload = saved ? null : check_overload(draft.form);

    const diagram = stations.slice(0, station_count).map((s) => ({
        name: or_dash(s.name),
        workers: s.customer_led ? 0 : or_dash(s.workers),
        minutes: or_dash(s.minutes),
        variance: variance_text(s, pro),
    }));

    return (
        <>
            {/* the key facts on one glass card, each with a small lime icon */}
            <View style={styles.facts}>
                <Fact icon="time-outline" text={`Open ${or_dash(format_time(basics.open_time))} to ${or_dash(format_time(basics.close_time))}`} />
                <Fact icon="people-outline" text={`${total === 1 ? "1 worker" : `${or_dash(total)} workers`} in total`} />
                <Fact icon="walk-outline" text={`About ${or_dash(arrivals.per_hour)} arrivals per hour`} />
                {arrivals.type === "bursty" ? (
                    <Fact icon="trending-up-outline" text={`Busiest around ${or_dash(format_time(arrivals.peak_time))}`} />
                ) : (
                    <Fact icon="remove-outline" text="Arrival rate is about the same all day" />
                )}
            </View>

            {overload ? (
                <View style={styles.warning} accessible accessibilityLiveRegion="polite">
                    <Text style={styles.warning_title}>Your stations may not keep up</Text>
                    <Text style={styles.warning_text}>
                        {`About ${Math.round(overload.arrivals)} people arrive per hour, but even with your workers split as well as possible, the stations can serve ${about(overload.capacity)} per hour. Waits will keep growing through the day.`}
                    </Text>
                    {/* overloaded runs took about 3x as long in testing (long queues mean many more events to simulate) */}
                    <View style={styles.warning_time}>
                        <Ionicons name="time-outline" size={20} color={COLORS.warning_text} />
                        <Text style={styles.warning_time_text}>
                            The simulation may end up taking multiple times longer than usual, which can mean a few minutes on some phones.
                        </Text>
                    </View>
                </View>
            ) : null}

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
    // a glass card
    facts: {
        padding: 18, gap: 12, marginBottom: 22, borderRadius: RADIUS.panel,
        backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.glass_edge, ...CARD_SHADOW,
    },
    fact_row: { flexDirection: "row", alignItems: "center", gap: 12 },
    fact_icon: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.accent_tint },
    fact: { flex: 1, fontFamily: FONTS.semibold, fontSize: 16, lineHeight: 22, color: COLORS.text },
    heading: { ...EYEBROW, paddingHorizontal: 4, marginBottom: 4 },
    warning: { padding: 18, gap: 6, marginBottom: 22, borderRadius: RADIUS.card, borderWidth: 1.5, borderColor: COLORS.starred, backgroundColor: COLORS.starred_light },
    warning_title: { fontSize: 17, fontFamily: FONTS.bold, color: COLORS.warning_text },
    warning_text: { fontFamily: FONTS.regular, fontSize: 16, lineHeight: 22, color: COLORS.text },
    warning_time: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginTop: 4, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.warning_divider },
    warning_time_text: { flex: 1, fontSize: 16, lineHeight: 22, fontFamily: FONTS.bold, color: COLORS.warning_text },
    problems: { marginTop: 20, fontFamily: FONTS.regular, fontSize: 16, color: COLORS.error },
});
