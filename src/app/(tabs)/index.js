import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@react-native-vector-icons/ionicons";

import { format_date_time } from "../../components/TimeInput.js";
import { list_runs, load_info } from "../../storage.js";

// every saved run with its run_info.json, newest first
async function load_runs()
{
    const runs = await Promise.all(list_runs().map(async (name) =>
    {
        const info = await load_info(name).catch(() => null);
        return { name: name, mode: info?.mode ?? null, date_run: info?.date_run ?? null };
    }));
    // runs without a date (shouldn't happen) go last
    return runs.sort((a, b) => (b.date_run ?? "").localeCompare(a.date_run ?? ""));
}

/**
 * Home: the saved runs (with a search bar), each opening its saved-run screen, and a New button.
 */
export default function HomeScreen()
{
    // null while loading
    const [runs, set_runs] = useState(null);
    const [search, set_search] = useState("");

    // any part of the name, ignoring capitals and spaces at the ends
    const query = search.trim().toLowerCase();
    const shown = (runs ?? []).filter((r) => r.name.toLowerCase().includes(query));

    // reload every time Home is shown, so new and deleted runs appear straight away
    useFocusEffect(useCallback(() =>
    {
        let active = true;
        load_runs().then((r) =>
        {
            if (active)
                set_runs(r);
        });
        return () =>
        {
            active = false;
        };
    }, []));

    function render_run({ item })
    {
        // "pro" is the stored name for Advanced mode
        const mode = item.mode === "pro" ? "Advanced" : item.mode === "simple" ? "Simple" : "";
        return (
            <Pressable
                style={styles.row}
                onPress={() => router.push({ pathname: "/runs/[name]", params: { name: item.name } })}
                accessibilityRole="button"
                accessibilityLabel={`${item.name}, ${format_date_time(item.date_run)}, ${mode}`}
            >
                <View style={styles.row_text}>
                    <Text style={styles.row_name}>{item.name}</Text>
                    <Text style={styles.row_detail}>{[format_date_time(item.date_run), mode].filter(Boolean).join("  ·  ")}</Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color="#555" />
            </Pressable>
        );
    }

    return (
        <View style={styles.screen}>
            {runs !== null && runs.length === 0 ? (
                <View style={styles.empty}>
                    <Text style={styles.empty_text}>No runs yet. Tap New to set up your first one.</Text>
                </View>
            ) : (
                <>
                    {/* outside the list, so typing doesn't lose focus as the list changes */}
                    <View style={styles.top}>
                        <Text style={styles.heading}>Your runs</Text>
                        <View style={styles.search}>
                            <Ionicons name="search" size={20} color="#666" />
                            <TextInput
                                style={styles.search_input}
                                value={search}
                                onChangeText={set_search}
                                placeholder="Search runs"
                                autoCorrect={false}
                                returnKeyType="search"
                                accessibilityLabel="Search runs by name"
                            />
                            {search !== "" ? (
                                <Pressable onPress={() => set_search("")} hitSlop={10} accessibilityRole="button" accessibilityLabel="Clear search">
                                    <Ionicons name="close-circle" size={20} color="#888" />
                                </Pressable>
                            ) : null}
                        </View>
                    </View>
                    <FlatList
                        data={shown}
                        keyExtractor={(item) => item.name}
                        renderItem={render_run}
                        contentContainerStyle={styles.list}
                        keyboardShouldPersistTaps="handled"
                        ListEmptyComponent={runs !== null ? <Text style={styles.no_match}>No runs match &quot;{search.trim()}&quot;.</Text> : null}
                    />
                </>
            )}

            <Pressable style={styles.new} onPress={() => router.push("/new-run")} accessibilityRole="button" accessibilityLabel="New run">
                <Ionicons name="add" size={24} color="#fff" />
                <Text style={styles.new_text}>New</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#f7f7f7" },
    top: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },
    heading: { fontSize: 22, fontWeight: "700", color: "#1a1a1a" },
    search: {
        flexDirection: "row", alignItems: "center", gap: 8, minHeight: 48, paddingHorizontal: 12,
        borderRadius: 10, borderWidth: 2, borderColor: "#c4c4c4", backgroundColor: "#fff",
    },
    search_input: { flex: 1, fontSize: 17, color: "#1a1a1a", paddingVertical: 8 },
    // room at the bottom so the New button never covers the last run
    list: { padding: 16, paddingBottom: 96 },
    no_match: { fontSize: 16, color: "#555", textAlign: "center", marginTop: 24 },
    row: {
        flexDirection: "row", alignItems: "center", gap: 12, minHeight: 68, padding: 14, marginBottom: 10,
        borderRadius: 10, borderWidth: 2, borderColor: "#c4c4c4", backgroundColor: "#fff",
    },
    row_text: { flex: 1, gap: 4 },
    row_name: { fontSize: 18, fontWeight: "600", color: "#1a1a1a" },
    row_detail: { fontSize: 15, color: "#555" },
    empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
    empty_text: { fontSize: 18, lineHeight: 26, color: "#444", textAlign: "center" },
    new: {
        position: "absolute", right: 20, bottom: 20, minHeight: 56, paddingHorizontal: 22, borderRadius: 28,
        flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#1d5fd1",
        elevation: 4, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
    },
    new_text: { fontSize: 18, fontWeight: "600", color: "#fff" },
});
