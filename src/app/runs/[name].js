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
import { COLORS } from "../../components/theme.js";

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
                <SummaryPage draft={{ form: form, mode: mode }} errors={{}} station_count={form.stations.length} saved />
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
                        <Ionicons name="copy-outline" size={20} color={COLORS.accent} />
                        <Text style={styles.secondary_text}>Duplicate</Text>
                    </Pressable>
                    <Pressable style={[styles.secondary, styles.danger]} onPress={confirm_delete} accessibilityRole="button">
                        <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                        <Text style={[styles.secondary_text, styles.danger_text]}>Delete</Text>
                    </Pressable>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: COLORS.background },
    body: { padding: 20 },
    meta: { fontSize: 15, color: COLORS.text_muted, marginBottom: 16 },
    bar: { paddingHorizontal: 20, paddingTop: 12, gap: 10, borderTopWidth: 1, borderTopColor: COLORS.divider, backgroundColor: COLORS.surface },
    primary: { minHeight: 52, borderRadius: 8, backgroundColor: COLORS.accent, alignItems: "center", justifyContent: "center" },
    primary_text: { fontSize: 18, fontWeight: "600", color: COLORS.on_accent },
    row: { flexDirection: "row", gap: 10 },
    secondary: {
        flex: 1, minHeight: 48, borderRadius: 8, borderWidth: 2, borderColor: COLORS.accent,
        flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.surface,
    },
    secondary_text: { fontSize: 16, fontWeight: "600", color: COLORS.accent },
    danger: { borderColor: COLORS.error },
    danger_text: { color: COLORS.error },
    missing: { alignItems: "center", justifyContent: "center", padding: 24 },
    missing_text: { fontSize: 17, color: COLORS.text, textAlign: "center" },
});
