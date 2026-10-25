import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { Ionicons } from "@react-native-vector-icons/ionicons";

import { DEV_PRESETS } from "../../lib/dev_presets.js";
import { useDraftRun } from "../../state/DraftRunContext.js";
import { useSettings } from "../../state/SettingsContext.js";
import { delete_run, list_runs } from "../../storage.js";
import { COLORS } from "../../components/theme.js";

// the on/off display settings, in the order shown
const SWITCHES = [
    {
        key: "results_arrows",
        label: "Arrow buttons on results pages",
        note: "Turn off for more room on small screens. You can still swipe between pages.",
    },
    {
        key: "bar_above_keyboard",
        label: "Keep the Next button above the keyboard",
        note: "Turn off on small screens to see more of the page while typing. Close the keyboard to reach the button.",
    },
];

/**
 * Settings: display options, About, delete every saved run, and a collapsed Developer section (timings switch, test presets).
 */
export default function SettingsScreen()
{
    const { begin_duplicate, set_name, go_to_page } = useDraftRun();
    const { settings, change_setting } = useSettings();
    // the Developer section starts closed so it stays out of the way
    const [developer_open, set_developer_open] = useState(false);

    function confirm_delete_all()
    {
        const count = list_runs().length;
        if (count === 0)
        {
            Alert.alert("No runs to delete", "You don't have any saved runs yet.");
            return;
        }
        Alert.alert(
            "Delete all runs?",
            `All ${count === 1 ? "1 saved run" : `${count} saved runs`} and their results will be deleted. This can't be undone.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete all",
                    style: "destructive",
                    onPress: () =>
                    {
                        for (const name of list_runs())
                            delete_run(name);
                    },
                },
            ],
        );
    }

    // loads a ready-made run (see lib/dev_presets.js) as a Simple draft on its Summary page, for testing and timing simulations
    function load_preset(preset)
    {
        const now = new Date();
        const stamp = [now.getHours(), now.getMinutes(), now.getSeconds()].map((n) => String(n).padStart(2, "0")).join("");
        begin_duplicate("simple", preset.schema);
        set_name(`${preset.short} preset ${stamp}`);
        // past the last page; review.js shows the last page (Summary)
        go_to_page(999);
        router.push("/review");
    }

    return (
        <ScrollView contentContainerStyle={styles.page}>
            <Text style={styles.heading}>Display</Text>
            {SWITCHES.map((s) => (
                <View key={s.key} style={[styles.card, styles.setting_row]}>
                    <View style={styles.setting_text}>
                        <Text style={styles.setting_label}>{s.label}</Text>
                        <Text style={styles.setting_note}>{s.note}</Text>
                    </View>
                    <Switch
                        value={settings[s.key]}
                        onValueChange={(v) => change_setting(s.key, v)}
                        trackColor={{ false: COLORS.border, true: COLORS.accent }}
                        accessibilityLabel={s.label}
                    />
                </View>
            ))}

            <Text style={styles.heading}>About</Text>
            <View style={styles.card}>
                <Text style={styles.about}>
                    ShiftLime is a queue planner for food banks, pantries and clinics. Describe how people move through your site, and it tests every way to split your workers to show which works better.
                </Text>
                <Text style={styles.about}>Built for the Congressional App Challenge.</Text>
            </View>

            <Text style={styles.heading}>Saved runs</Text>
            <Pressable style={styles.danger_button} onPress={confirm_delete_all} accessibilityRole="button">
                <Text style={styles.danger_text}>Delete all runs</Text>
            </Pressable>

            {/* collapsed by default; tap the heading to show the test presets */}
            <Pressable
                style={styles.dropdown_heading}
                onPress={() => set_developer_open(!developer_open)}
                accessibilityRole="button"
                accessibilityState={{ expanded: developer_open }}
                accessibilityLabel="Developer"
            >
                <Text style={styles.heading}>Developer</Text>
                <Ionicons name={developer_open ? "chevron-up" : "chevron-down"} size={22} color={COLORS.text_muted} />
            </Pressable>
            {developer_open ? (
                <View style={styles.card}>
                    <View style={styles.setting_row}>
                        <View style={styles.setting_text}>
                            <Text style={styles.setting_label}>Show timings</Text>
                            <Text style={styles.setting_note}>Shows how long each simulation took, at the bottom of its results.</Text>
                        </View>
                        <Switch
                            value={settings["show_timings"]}
                            onValueChange={(v) => change_setting("show_timings", v)}
                            trackColor={{ false: COLORS.border, true: COLORS.accent }}
                            accessibilityLabel="Show timings"
                        />
                    </View>
                    <View style={styles.divider} />
                    <Text style={styles.dev_note}>Load a test run on its Summary page, then tap Start simulation.</Text>
                    {DEV_PRESETS.map((p) => (
                        <Pressable key={p.short} style={styles.preset} onPress={() => load_preset(p)} accessibilityRole="button">
                            <Text style={styles.preset_text}>{p.label}</Text>
                        </Pressable>
                    ))}
                </View>
            ) : null}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    page: { padding: 20, gap: 12, backgroundColor: COLORS.background, flexGrow: 1 },
    heading: { fontSize: 20, fontWeight: "700", color: COLORS.text, marginTop: 8 },
    danger_button: { minHeight: 52, borderRadius: 8, borderWidth: 2, borderColor: COLORS.error, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.surface },
    danger_text: { fontSize: 17, fontWeight: "600", color: COLORS.error },
    card: { padding: 16, gap: 10, borderRadius: 10, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.divider },
    about: { fontSize: 16, lineHeight: 23, color: COLORS.text },
    setting_row: { flexDirection: "row", alignItems: "center", gap: 12 },
    setting_text: { flex: 1, gap: 4 },
    setting_label: { fontSize: 17, fontWeight: "600", color: COLORS.text },
    setting_note: { fontSize: 14, lineHeight: 20, color: COLORS.text_faint },
    // the heading row is the tap target, so it gets a finger-sized height
    dropdown_heading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 44 },
    divider: { height: 1, backgroundColor: COLORS.divider, marginVertical: 4 },
    dev_note: { fontSize: 14, color: COLORS.text_faint },
    preset: { minHeight: 44, paddingHorizontal: 14, justifyContent: "center", borderRadius: 8, borderWidth: 2, borderColor: COLORS.accent },
    preset_text: { fontSize: 15, color: COLORS.accent },
});
