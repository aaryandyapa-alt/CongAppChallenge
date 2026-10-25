import { Stack, router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@react-native-vector-icons/ionicons";

import { format_date_time } from "../../components/TimeInput.js";
import { schema_to_form } from "../../lib/form_to_schema.js";
import SummaryPage from "../../review/SummaryPage.js";
import { useDraftRun } from "../../state/DraftRunContext.js";
import { delete_run, load_info, load_input } from "../../storage.js";

/**
 * A saved run: its inputs, plus View results, Duplicate and Delete.
 */
export default function SavedRunScreen()
{
    const { name } = useLocalSearchParams();
    const insets = useSafeAreaInsets();
    const { begin_duplicate } = useDraftRun();
    // null while loading, then { input, info }, or { missing: true }
    const [run, set_run] = useState(null);

    useEffect(() =>
    {
        Promise.all([load_input(name), load_info(name)])
            .then(([input, info]) => set_run(input ? { input, info } : { missing: true }))
            .catch(() => set_run({ missing: true }));
    }, [name]);

    if (run === null)
        return <View style={styles.screen} />;

    if (run.missing)
    {
        return (
            <View style={[styles.screen, styles.missing]}>
                <Stack.Screen options={{ title: name }} />
                <Text style={styles.missing_text}>This run couldn&apos;t be found.</Text>
            </View>
        );
    }

    const mode = run.info?.mode === "pro" ? "pro" : "simple";
    const form = schema_to_form(run.input).form;

    function duplicate()
    {
        // the copy keeps this run's mode; New run only asks for a name
        begin_duplicate(mode, run.input);
        router.push({ pathname: "/new-run", params: { duplicate: "1" } });
    }

    function confirm_delete()
    {
        Alert.alert(
            "Delete this run?",
            `"${name}" and its results will be deleted. This can't be undone.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () =>
                    {
                        delete_run(name);
                        router.back();
                    },
                },
            ],
        );
    }

    return (
        <View style={styles.screen}>
            <Stack.Screen options={{ title: name }} />
            <ScrollView contentContainerStyle={styles.body}>
                <Text style={styles.meta}>
                    {[format_date_time(run.info?.date_run), mode === "pro" ? "Advanced" : "Simple"].filter(Boolean).join("  ·  ")}
                </Text>
                {/* the same summary the user saw before simulating; a saved run has no problems to show */}
                <SummaryPage draft={{ form: form, mode: mode }} errors={{}} station_count={form.stations.length} />
            </ScrollView>

            <View style={[styles.bar, { paddingBottom: 12 + insets.bottom }]}>
                <Pressable
                    style={styles.primary}
                    onPress={() => router.push({ pathname: "/results/[name]", params: { name: name } })}
                    accessibilityRole="button"
                >
                    <Text style={styles.primary_text}>View results</Text>
                </Pressable>
                <View style={styles.row}>
                    <Pressable style={styles.secondary} onPress={duplicate} accessibilityRole="button" accessibilityHint="Copies this run so you can change it and simulate again">
                        <Ionicons name="copy-outline" size={20} color="#1d5fd1" />
                        <Text style={styles.secondary_text}>Duplicate</Text>
                    </Pressable>
                    <Pressable style={[styles.secondary, styles.danger]} onPress={confirm_delete} accessibilityRole="button">
                        <Ionicons name="trash-outline" size={20} color="#b3261e" />
                        <Text style={[styles.secondary_text, styles.danger_text]}>Delete</Text>
                    </Pressable>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#f7f7f7" },
    body: { padding: 20 },
    meta: { fontSize: 15, color: "#555", marginBottom: 16 },
    bar: { paddingHorizontal: 20, paddingTop: 12, gap: 10, borderTopWidth: 1, borderTopColor: "#e2e2e2", backgroundColor: "#fff" },
    primary: { minHeight: 52, borderRadius: 8, backgroundColor: "#1d5fd1", alignItems: "center", justifyContent: "center" },
    primary_text: { fontSize: 18, fontWeight: "600", color: "#fff" },
    row: { flexDirection: "row", gap: 10 },
    secondary: {
        flex: 1, minHeight: 48, borderRadius: 8, borderWidth: 2, borderColor: "#1d5fd1",
        flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center", backgroundColor: "#fff",
    },
    secondary_text: { fontSize: 16, fontWeight: "600", color: "#1d5fd1" },
    danger: { borderColor: "#b3261e" },
    danger_text: { color: "#b3261e" },
    missing: { alignItems: "center", justifyContent: "center", padding: 24 },
    missing_text: { fontSize: 17, color: "#1a1a1a", textAlign: "center" },
});
