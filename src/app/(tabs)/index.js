import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@react-native-vector-icons/ionicons";

import BrandHeader from "../../components/BrandHeader.js";
import GlowBackground from "../../components/GlowBackground.js";
import Gradient from "../../components/Gradient.js";
import { format_date_time } from "../../components/TimeInput.js";
import { useSettings } from "../../state/SettingsContext.js";
import { list_runs, load_info } from "../../storage.js";
import { CARD_SHADOW, COLORS, EYEBROW, FLOATING_SHADOW, FONTS, RADIUS, TAB_BAR } from "../../components/theme.js";

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
    const { settings, loaded } = useSettings();
    // only open it once per app launch, even if Home re-renders before the tutorial marks itself seen
    const opened_tutorial = useRef(false);
    const insets = useSafeAreaInsets();

    // first launch: show the welcome tutorial, once the saved settings are in (so returning users never see a flash of it)
    useEffect(() =>
    {
        if (loaded && !settings["seen_tutorial"] && !opened_tutorial.current)
        {
            opened_tutorial.current = true;
            router.push("/tutorial");
        }
    }, [loaded, settings]);

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
                <View style={styles.chevron}>
                    <Ionicons name="chevron-forward" size={18} color={COLORS.accent_deep} />
                </View>
            </Pressable>
        );
    }

    // the floating tab bar covers the bottom of the screen, so the list and the New button sit above it
    const above_tab_bar = insets.bottom + TAB_BAR.gap + TAB_BAR.height;

    return (
        <View style={styles.screen}>
            <GlowBackground />
            <BrandHeader />
            {runs !== null && runs.length === 0 ? (
                <View style={styles.empty}>
                    <Text style={styles.empty_text}>No runs yet. Tap New to set up your first one.</Text>
                </View>
            ) : (
                <>
                    {/* outside the list, so typing doesn't lose focus as the list changes */}
                    <View style={styles.top}>
                        <View style={styles.search}>
                            <Ionicons name="search" size={20} color={COLORS.text_faint} />
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
                                    <Ionicons name="close-circle" size={20} color={COLORS.placeholder} />
                                </Pressable>
                            ) : null}
                        </View>
                        <Text style={styles.eyebrow}>{runs === null ? "Your runs" : `Your runs · ${runs.length}`}</Text>
                    </View>
                    <FlatList
                        data={shown}
                        keyExtractor={(item) => item.name}
                        renderItem={render_run}
                        contentContainerStyle={[styles.list, { paddingBottom: above_tab_bar + 90 }]}
                        keyboardShouldPersistTaps="handled"
                        ListEmptyComponent={runs !== null ? <Text style={styles.no_match}>No runs match &quot;{search.trim()}&quot;.</Text> : null}
                    />
                </>
            )}

            {/* the shadow is on the outside, the gradient (with its rounded corners) inside */}
            <Pressable
                style={({ pressed }) => [styles.new, { bottom: above_tab_bar + 16 }, pressed && styles.new_pressed]}
                onPress={() => router.push("/new-run")}
                accessibilityRole="button"
                accessibilityLabel="New run"
            >
                <Gradient name="button" style={styles.new_fill}>
                    <Ionicons name="add" size={24} color={COLORS.on_accent} />
                    <Text style={styles.new_text}>New</Text>
                </Gradient>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: COLORS.background },
    top: { paddingHorizontal: 16, paddingTop: 16, gap: 18 },
    // a glass pill
    search: {
        flexDirection: "row", alignItems: "center", gap: 8, minHeight: 50, paddingHorizontal: 16,
        borderRadius: RADIUS.pill, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.surface,
    },
    search_input: { flex: 1, fontFamily: FONTS.regular, fontSize: 17, color: COLORS.text, paddingVertical: 8 },
    eyebrow: { ...EYEBROW, paddingHorizontal: 6 },
    // the bottom padding (room for the tab bar and the New button) is added in the component
    list: { paddingHorizontal: 16, paddingTop: 10 },
    no_match: { fontFamily: FONTS.regular, fontSize: 16, color: COLORS.text_muted, textAlign: "center", marginTop: 24 },
    // glass cards
    row: {
        flexDirection: "row", alignItems: "center", gap: 12, minHeight: 72, paddingVertical: 14, paddingLeft: 18, paddingRight: 14, marginBottom: 12,
        borderRadius: RADIUS.card, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.glass_edge, ...CARD_SHADOW,
    },
    row_text: { flex: 1, gap: 4 },
    row_name: { fontSize: 17, fontFamily: FONTS.bold, color: COLORS.text },
    row_detail: { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.text_muted },
    // the arrow sits in a small lime circle
    chevron: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.accent_tint },
    empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
    empty_text: { fontFamily: FONTS.regular, fontSize: 18, lineHeight: 26, color: COLORS.text_secondary, textAlign: "center" },
    new: { position: "absolute", right: 20, borderRadius: RADIUS.pill, ...FLOATING_SHADOW },
    new_pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
    new_fill: { minHeight: 56, paddingHorizontal: 22, borderRadius: RADIUS.pill, overflow: "hidden", flexDirection: "row", alignItems: "center", gap: 6 },
    new_text: { fontSize: 17, fontFamily: FONTS.bold, color: COLORS.on_accent },
});
