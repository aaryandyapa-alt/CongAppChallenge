import { Stack, router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@react-native-vector-icons/ionicons";

import HomeButton from "../../components/HomeButton.js";
import { schema_to_form } from "../../lib/form_to_schema.js";
import { SCENARIOS } from "../../lib/result_sentences.js";
import ResultsSummaryPage from "../../results/ResultsSummaryPage.js";
import ScenarioPage from "../../results/ScenarioPage.js";
import { load_info, load_input, load_output } from "../../storage.js";

// the four scenario pages, then the Summary
const PAGES = [...SCENARIOS, "summary"];

/**
 * A saved run's results: five pages you swipe (or tap the arrows) through.
 * Opened right after a simulation (?from=new) it starts on the current setup; from Home it starts on the Summary.
 */
export default function ResultsScreen()
{
    const { name, from, took } = useLocalSearchParams();
    const { width } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const list = useRef(null);

    const start = from === "new" ? 0 : PAGES.length - 1;
    const [index, set_index] = useState(start);
    // null while loading, then { input, output, info }, or { missing: true }
    const [run, set_run] = useState(null);

    useEffect(() =>
    {
        Promise.all([load_input(name), load_output(name), load_info(name)])
            .then(([input, output, info]) => set_run(input && output ? { input, output, info } : { missing: true }))
            .catch(() => set_run({ missing: true }));
    }, [name]);

    function go_to(i)
    {
        set_index(i);
        list.current?.scrollToIndex({ index: i, animated: true });
    }

    if (run === null)
        return <View style={styles.screen} />;

    if (run.missing)
    {
        return (
            <View style={[styles.screen, styles.missing]}>
                <Stack.Screen options={{ title: name }} />
                <Text style={styles.missing_text}>This run&apos;s results couldn&apos;t be found.</Text>
            </View>
        );
    }

    const form = schema_to_form(run.input).form;
    const pro = run.info?.mode === "pro";

    function render_page({ item })
    {
        return (
            <ScrollView style={{ width: width }} contentContainerStyle={styles.page}>
                {item === "summary"
                    ? <ResultsSummaryPage output={run.output} on_jump={go_to} on_home={() => router.dismissTo("/")} />
                    : <ScenarioPage scenario_key={item} output={run.output} form={form} pro={pro} />}
            </ScrollView>
        );
    }

    // right after a run, the setup screens are closed, so "back" would go Home anyway: show that as a home icon.
    // From a saved run, the normal back arrow returns to it.
    const header = from === "new"
        ? { title: name, headerTitleAlign: "center", headerBackVisible: false, headerLeft: () => <HomeButton ask={false} /> }
        : { title: name, headerTitleAlign: "center" };

    return (
        <View style={styles.screen}>
            <Stack.Screen options={header} />

            <FlatList
                ref={list}
                data={PAGES}
                keyExtractor={(item) => item}
                renderItem={render_page}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                initialScrollIndex={start}
                getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
                onMomentumScrollEnd={(e) => set_index(Math.round(e.nativeEvent.contentOffset.x / width))}
            />

            {/* round arrow buttons at the middle of each side; hidden at the ends */}
            {index > 0 ? (
                <Pressable style={[styles.arrow, styles.arrow_left]} onPress={() => go_to(index - 1)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Previous page">
                    <Ionicons name="chevron-back" size={26} color="#1d5fd1" />
                </Pressable>
            ) : null}
            {index < PAGES.length - 1 ? (
                <Pressable style={[styles.arrow, styles.arrow_right]} onPress={() => go_to(index + 1)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Next page">
                    <Ionicons name="chevron-forward" size={26} color="#1d5fd1" />
                </Pressable>
            ) : null}

            <View style={[styles.footer, { paddingBottom: 10 + insets.bottom }]}>
                <Text style={styles.footer_text} accessibilityLiveRegion="polite">{index + 1} of {PAGES.length}</Text>
                {/* TEMPORARY: how long the simulation took, for timing on phones; remove with the speed-up work */}
                {took ? <Text style={styles.took}>Simulation took {took} s</Text> : null}
            </View>
        </View>
    );
}

const ARROW = 44;

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#f7f7f7" },
    // side padding leaves room for the arrow buttons
    page: { paddingVertical: 20, paddingHorizontal: ARROW + 16 },
    arrow: {
        position: "absolute", top: "50%", marginTop: -ARROW / 2 - 20,
        width: ARROW, height: ARROW, borderRadius: ARROW / 2,
        alignItems: "center", justifyContent: "center",
        backgroundColor: "#fff", borderWidth: 2, borderColor: "#1d5fd1",
        elevation: 3, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
    },
    arrow_left: { left: 8 },
    arrow_right: { right: 8 },
    footer: { alignItems: "center", paddingTop: 10, borderTopWidth: 1, borderTopColor: "#e2e2e2", backgroundColor: "#fff" },
    footer_text: { fontSize: 15, color: "#555" },
    took: { fontSize: 12, color: "#999", marginTop: 2 },
    missing: { alignItems: "center", justifyContent: "center", padding: 24 },
    missing_text: { fontSize: 17, color: "#1a1a1a", textAlign: "center" },
});
