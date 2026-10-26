import { Redirect, Stack, router, usePreventRemove } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AiReminder from "../components/AiReminder.js";
import BottomBar from "../components/BottomBar.js";
import GlowBackground from "../components/GlowBackground.js";
import HomeButton from "../components/HomeButton.js";
import PrimaryButton from "../components/PrimaryButton.js";
import ProgressCircles from "../components/ProgressCircles.js";
import { BackButton } from "../components/RoundButton.js";
import { has_errors, MAX_STATIONS } from "../lib/form_checks.js";
import ArrivalsPage from "../review/ArrivalsPage.js";
import BasicsPage from "../review/BasicsPage.js";
import SimSettingsPage from "../review/SimSettingsPage.js";
import StationPage from "../review/StationPage.js";
import SummaryPage from "../review/SummaryPage.js";
import { useDraftRun } from "../state/DraftRunContext.js";
import { useSettings } from "../state/SettingsContext.js";
import { FONTS, RADIUS } from "../components/theme.js";
import { useThemedStyles } from "../components/ThemeContext.js";

// how many station pages to show; none while the count is blank or not a whole number
function shown_station_count(count)
{
    return Number.isInteger(count) && count > 0 ? Math.min(count, MAX_STATIONS) : 0;
}

// the review pages in order; prefix is the start of the form paths on that page
function build_pages(draft)
{
    const n = shown_station_count(draft.form.basics.station_count);
    const pages = [
        { name: "Establishment basics", kind: "basics", prefix: "basics." },
        { name: "Arrivals", kind: "arrivals", prefix: "arrivals." },
    ];
    for (let i=0; i<n; i++)
        pages.push({ name: `Station ${i + 1} of ${n}`, kind: "station", prefix: `stations.${i}.`, index: i });
    if (draft.mode === "pro")
        pages.push({ name: "Simulation settings", kind: "sim", prefix: "sim." });
    pages.push({ name: "Summary", kind: "summary" });
    return pages;
}

/**
 * The paginated review screens, opened from src/app/intro.js. Every Simple path ends here, and Pro uses the same screens.
 * The page being shown lives in the draft (draft.page), so stars can clear when a page is left.
 */
export default function ReviewScreen()
{
    const styles = useThemedStyles(make_styles);
    const { draft, errors, edit_field, go_to_page } = useDraftRun();
    const { settings } = useSettings();
    const insets = useSafeAreaInsets();
    // how much of the bottom the floating Next bar covers; the page gets that much room at its end
    const [bar_height, set_bar_height] = useState(0);

    const pages = draft === null ? [] : build_pages(draft);
    const current = Math.min(draft?.page ?? 0, Math.max(pages.length - 1, 0));

    // the back arrow and Android's back button go to the previous page; on the first page they go back to the intro.
    // Once the run is finished, the simulating screen closes this one, so it stops blocking.
    const disable_prevention = usePreventRemove(draft !== null && !draft.finished && current > 0, () => go_to_page(current - 1));

    // opened with no run being set up (for example from a stale link)
    if (draft === null)
        return <Redirect href="/" />;

    const page = pages[current];
    const is_last = current === pages.length - 1;
    const can_simulate = Object.keys(errors).length === 0;

    const circles = pages.map((p) =>
    {
        if (!p.prefix)
            return { name: p.name, status: null };
        if (has_errors(errors, p.prefix))
            return { name: p.name, status: "error" };
        const starred = Object.keys(draft.starred).some((path) => path.startsWith(p.prefix));
        return { name: p.name, status: starred ? "starred" : null };
    });

    const props = { draft: draft, errors: errors, edit_field: edit_field };
    const is_ai_filled = draft.start_state === "ai-full" || draft.start_state === "ai-partial";
    let content;
    if (page.kind === "basics")
        content = <BasicsPage {...props} />;
    else if (page.kind === "arrivals")
        content = <ArrivalsPage {...props} />;
    else if (page.kind === "station")
        content = <StationPage {...props} index={page.index} />;
    else if (page.kind === "sim")
        content = <SimSettingsPage {...props} />;
    else
        content = <SummaryPage draft={draft} errors={errors} station_count={shown_station_count(draft.form.basics.station_count)} />;

    function press_button()
    {
        if (!is_last)
            go_to_page(current + 1);
        else if (can_simulate)
            router.push("/simulating");
    }

    const button_text = is_last ? "Start simulation" : "Next";
    const button_disabled = is_last && !can_simulate;

    const bar = (
        <BottomBar on_height={set_bar_height}>
            <PrimaryButton label={button_text} on_press={press_button} disabled={button_disabled} />
        </BottomBar>
    );
    // the Settings option "Keep the Next button above the keyboard"; off leaves the bar behind the keyboard for more room
    const bar_above_keyboard = settings["bar_above_keyboard"];

    return (
        <View style={styles.screen}>
            <GlowBackground />
            {/* iOS swipe-back only on the first page, since later pages go back a page instead */}
            <Stack.Screen options={{ gestureEnabled: current === 0 }} />

            {/* the top: back (a page, or to the intro from the first one), the page's number and title, home,
                and the progress bar, on frosted glass with a soft shadow separating it from the page */}
            <View style={[styles.top, { paddingTop: insets.top + 8 }]}>
                <View style={styles.top_row}>
                    <BackButton />
                    <View style={styles.heading}>
                        <Text style={styles.eyebrow}>Page {current + 1} of {pages.length}</Text>
                        <Text style={styles.title} numberOfLines={2} accessibilityRole="header">{page.name}</Text>
                    </View>
                    <HomeButton disable_prevention={disable_prevention} />
                </View>
                <ProgressCircles pages={circles} current={current} on_jump={go_to_page} />
            </View>

            {/* shrinks above the keyboard so the box being typed in stays visible (and the bar too, if it's inside).
                "padding" on both platforms: Android's edge-to-edge mode doesn't resize the screen for the keyboard.
                No offset: with no header bar, this screen starts at the top of the window */}
            <KeyboardAvoidingView style={styles.body} behavior="padding">
                {/* no padding on this view, so the floating bar sits at its very bottom (just above the keyboard) */}
                <View style={styles.body}>
                    {/* a new key per page starts each page scrolled to the top. The end of the page gets room
                        for the floating bar, so the last field can scroll out from under it */}
                    <ScrollView
                        key={current}
                        style={styles.body}
                        contentContainerStyle={[styles.body_content, { paddingBottom: bar_height + 20 }]}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* the reminder only shows on field pages of runs the AI filled in */}
                        {is_ai_filled && page.kind !== "summary" ? <AiReminder /> : null}
                        {/* the fields sit on one glass card; the Summary has its own cards */}
                        {page.kind === "summary" ? content : <View style={styles.card}>{content}</View>}
                    </ScrollView>
                    {bar_above_keyboard ? bar : null}
                </View>
            </KeyboardAvoidingView>
            {bar_above_keyboard ? null : bar}
        </View>
    );
}

const make_styles = ({ COLORS, EYEBROW, CARD_SHADOW, HEADER_SHADOW }) => StyleSheet.create({
    screen: { flex: 1, backgroundColor: COLORS.background },
    // above the page (zIndex) so its shadow isn't covered by it
    top: { paddingBottom: 2, backgroundColor: COLORS.surface, zIndex: 1, ...HEADER_SHADOW },
    top_row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16 },
    heading: { flex: 1, alignItems: "center", gap: 2 },
    eyebrow: { ...EYEBROW, fontSize: 11 },
    title: { fontSize: 20, fontFamily: FONTS.extrabold, color: COLORS.text, textAlign: "center", letterSpacing: -0.4 },
    body: { flex: 1 },
    // the bottom padding (room for the floating bar) is added in the component
    body_content: { paddingHorizontal: 16, paddingTop: 18 },
    // no bottom padding: every field already has space under it
    card: {
        paddingHorizontal: 18, paddingTop: 20, borderRadius: RADIUS.panel,
        backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.glass_edge, ...CARD_SHADOW,
    },
});
