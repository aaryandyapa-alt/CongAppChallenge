import { useEffect } from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

import LevelPicker, { BURST_OPTIONS, VARIANCE_OPTIONS } from "../components/LevelPicker.js";
import NumberInput from "../components/NumberInput.js";
import StarredField from "../components/StarredField.js";
import TimeInput from "../components/TimeInput.js";
import { useDraftRun } from "../state/DraftRunContext.js";

// TEMPORARY test screen for steps 3 and 4; delete in step 9 with Home's temporary links.
// It fills a draft the way an AI result with two blanks would, so stars and errors show up.
const fake_ai_result = {
    "stations": [
        { "id": 0, "label": "Intake", "workers": 2, "service_time_minutes": { "distribution": "lognormal", "mean": null, "stddev": null } },
        { "id": 1, "label": "Groceries", "workers": 3, "service_time_minutes": { "distribution": "lognormal", "mean": 6, "stddev": 2.4 } },
    ],
    "routing": "linear",
    "arrival_pattern": { "type": "bursty", "avg_arrivals_per_hour": 25, "peak_time": 12, "burst_frac": 0.5 },
    "operating_hours": { "open": 10.5, "close": 16 },
    "constraints": { "max_total_workers": 5 },
    "simulation_settings": null,
};

export default function DevComponentsScreen()
{
    const { draft, errors, begin_run, fill_from_ai, edit_field, go_to_page } = useDraftRun();

    useEffect(() =>
    {
        begin_run("component test", "simple");
        fill_from_ai(fake_ai_result);
    }, [begin_run, fill_from_ai]);

    if (draft === null || draft.start_state === null)
        return null;

    const f = draft.form;
    // each field gets its value, its star and its error from the draft
    const field = (path) => ({ starred: !!draft.starred[path], error: errors[path] ?? null });

    return (
        <ScrollView contentContainerStyle={styles.page}>
            <Text style={styles.note}>
                Temporary test screen. Page {draft.page}. Station 1&apos;s minutes and variance are starred.
                Change one, then tap &quot;Leave page&quot;: its star clears, the other one stays.
            </Text>

            <StarredField label="Opening time" {...field("basics.open_time")}>
                <TimeInput label="Opening time" value={f.basics.open_time} on_change={(v) => edit_field("basics.open_time", v)} />
            </StarredField>
            <StarredField label="Closing time" {...field("basics.close_time")}>
                <TimeInput label="Closing time" default_pm value={f.basics.close_time} on_change={(v) => edit_field("basics.close_time", v)} />
            </StarredField>
            <StarredField label="Station 2 (Groceries): workers" {...field("stations.1.workers")}>
                <NumberInput label="Workers" whole value={f.stations[1].workers} on_change={(v) => edit_field("stations.1.workers", v)} />
            </StarredField>
            <StarredField label="Station 1 (Intake): average minutes per person" {...field("stations.0.minutes")}>
                <NumberInput label="Average minutes" suffix="mins" value={f.stations[0].minutes} on_change={(v) => edit_field("stations.0.minutes", v)} />
            </StarredField>
            <StarredField label="Station 1 (Intake): how much does the time vary?" {...field("stations.0.variance_level")}>
                <LevelPicker label="How much the time varies" options={VARIANCE_OPTIONS} value={f.stations[0].variance_level} on_change={(v) => edit_field("stations.0.variance_level", v)} />
            </StarredField>
            <StarredField label="How much busier is the busiest time?" {...field("arrivals.burst_level")}>
                <LevelPicker label="How much busier" options={BURST_OPTIONS} value={f.arrivals.burst_level} on_change={(v) => edit_field("arrivals.burst_level", v)} />
            </StarredField>

            <Pressable style={styles.button} onPress={() => go_to_page(draft.page + 1)} accessibilityRole="button">
                <Text style={styles.button_text}>Leave page</Text>
            </Pressable>
            <Text style={styles.note}>Current form values: {JSON.stringify({ basics: f.basics, station_1: f.stations[0], burst_level: f.arrivals.burst_level })}</Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    page: { padding: 20 },
    note: { fontSize: 14, color: "#555", marginBottom: 20 },
    button: { backgroundColor: "#1d5fd1", borderRadius: 8, minHeight: 48, alignItems: "center", justifyContent: "center", marginBottom: 20 },
    button_text: { color: "#fff", fontSize: 17, fontWeight: "600" },
});
