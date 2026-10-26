import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Ionicons } from "@react-native-vector-icons/ionicons";

import BottomBar from "../../components/BottomBar.js";
import GlowBackground from "../../components/GlowBackground.js";
import Gradient from "../../components/Gradient.js";
import HomeButton from "../../components/HomeButton.js";
import { BackButton } from "../../components/RoundButton.js";
import TopBar from "../../components/TopBar.js";
import { schema_to_form } from "../../lib/form_to_schema.js";
import { SCENARIOS } from "../../lib/result_sentences.js";
import ResultsSummaryPage from "../../results/ResultsSummaryPage.js";
import ScenarioPage from "../../results/ScenarioPage.js";
import { useSettings } from "../../state/SettingsContext.js";
import { load_info, load_input, load_output } from "../../storage.js";
import { FONTS } from "../../components/theme.js";
import { useTheme, useThemedStyles } from "../../components/ThemeContext.js";

// the four scenario pages, then the Summary
const PAGES = [...SCENARIOS, "summary"];

// a round arrow button at the middle of one side; faded and untappable when there's no page that way
function Arrow({ side, enabled, on_press })
{
    const { COLORS } = useTheme();
    const styles = useThemedStyles(make_styles);
    return (
        <Pressable
            style={[styles.arrow, side === "left" ? styles.arrow_left : styles.arrow_right, !enabled && styles.arrow_off]}
            onPress={on_press}
            disabled={!enabled}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityState={{ disabled: !enabled }}
            accessibilityLabel={side === "left" ? "Previous page" : "Next page"}
        >
            <Gradient name="outline" style={styles.arrow_ring}>
                <View style={styles.arrow_inner}>
                    <Ionicons name={side === "left" ? "chevron-back" : "chevron-forward"} size={26} color={COLORS.accent_text} />
                </View>
            </Gradient>
        </Pressable>
    );
}

/**
 * A saved run's results: five pages you swipe (or tap the arrows, unless they're turned off in Settings) through.
 * Opened right after a simulation (?from=new) it starts on the current setup; from Home it starts on the Summary.
 */
export default function ResultsScreen()
{
    const styles = useThemedStyles(make_styles);
    const { name, from } = useLocalSearchParams();
    const { width } = useWindowDimensions();
    const list = useRef(null);

    const start = from === "new" ? 0 : PAGES.length - 1;
    const [index, set_index] = useState(start);
    const { settings } = useSettings();
    // null while loading, then { input, output, info }, or { missing: true }
    const [run, set_run] = useState(null);
    // how much of the bottom the floating page counter covers
    const [bar_height, set_bar_height] = useState(0);

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
            <View style={styles.screen}>
                <TopBar left={<BackButton />} title={name} />
                <View style={styles.missing}>
                    <Text style={styles.missing_text}>This run&apos;s results couldn&apos;t be found.</Text>
                </View>
            </View>
        );
    }

    const form = schema_to_form(run.input).form;
    const pro = run.info?.mode === "pro";
    // the arrow buttons can be turned off in Settings, which gives the pages their full width
    const show_arrows = settings["results_arrows"];

    function render_page({ item })
    {
        return (
            // the end of each page gets room for the floating bar, so its last line can scroll out from under it
            <ScrollView style={{ width: width }} contentContainerStyle={[styles.page, !show_arrows && styles.page_no_arrows, { paddingBottom: bar_height + 20 }]}>
                {item === "summary"
                    ? <ResultsSummaryPage output={run.output} on_jump={go_to} on_home={() => router.dismissTo("/")} />
                    : <ScenarioPage scenario_key={item} output={run.output} form={form} pro={pro} />}
            </ScrollView>
        );
    }

    // right after a run, the setup screens are closed, so "back" would go Home anyway: show that as a home button.
    // From a saved run, the back arrow returns to it. Each page has its own big title, so the run name is the small label.
    return (
        <View style={styles.screen}>
            <GlowBackground />
            <TopBar left={from === "new" ? <HomeButton ask={false} /> : <BackButton />} label={name} raised />

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

            {/* round arrow buttons at the middle of each side; at the first and last page the one that can't go
                anywhere stays, faded and untappable, so the gap beside the page isn't empty */}
            {show_arrows ? (
                <>
                    <Arrow side="left" enabled={index > 0} on_press={() => go_to(index - 1)} />
                    <Arrow side="right" enabled={index < PAGES.length - 1} on_press={() => go_to(index + 1)} />
                </>
            ) : null}

            {/* a floating white bar across the bottom: a dot per page (the current one long and lime) and "2 of 5" */}
            <BottomBar style={styles.footer} on_height={set_bar_height}>
                <View style={styles.dots}>
                    {PAGES.map((p, i) => <View key={p} style={[styles.dot, i === index && styles.dot_current]} />)}
                </View>
                <Text style={styles.footer_text} accessibilityLiveRegion="polite">{index + 1} of {PAGES.length}</Text>
                {/* how long the simulation took (saved in run_info.json), with Settings > Developer > Show timings on;
                    runs saved before timings were kept have none */}
                {settings["show_timings"] && typeof run.info?.simulation_seconds === "number" ? (
                    <Text style={styles.took}>Simulation took {run.info.simulation_seconds.toFixed(1)} s</Text>
                ) : null}
            </BottomBar>
        </View>
    );
}

const ARROW = 44;

const make_styles = ({ COLORS, CARD_SHADOW }) => StyleSheet.create({
    screen: { flex: 1, backgroundColor: COLORS.background },
    // side padding leaves room for the arrow buttons
    // the bottom padding (room for the floating bar) is added in the component
    page: { paddingTop: 20, paddingHorizontal: ARROW + 16 },
    page_no_arrows: { paddingHorizontal: 20 },
    arrow: {
        position: "absolute", top: "50%", marginTop: -ARROW / 2 - 20,
        width: ARROW, height: ARROW, borderRadius: ARROW / 2, ...CARD_SHADOW,
    },
    // a gradient ring, like OutlineButton: the gradient shows in the 2-wide gap around the inner circle
    arrow_ring: { flex: 1, borderRadius: ARROW / 2, padding: 2, overflow: "hidden" },
    arrow_inner: { flex: 1, borderRadius: ARROW / 2 - 2, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.surface_solid },
    arrow_left: { left: 8 },
    arrow_right: { right: 8 },
    arrow_off: { opacity: 0.3 },
    // as wide as the screen (less the bar's side gaps), like the other screens' bottom bars
    footer: { alignItems: "center", gap: 6, paddingVertical: 12 },
    dots: { flexDirection: "row", gap: 6 },
    dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.track },
    dot_current: { width: 22, backgroundColor: COLORS.accent },
    footer_text: { fontFamily: FONTS.semibold, fontSize: 13, color: COLORS.text_muted },
    took: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.text_tiny, marginTop: 2 },
    missing: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
    missing_text: { fontFamily: FONTS.regular, fontSize: 17, color: COLORS.text, textAlign: "center" },
});
