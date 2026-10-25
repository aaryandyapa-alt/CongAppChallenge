import { Redirect, Stack, router, usePreventRemove } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import HomeButton from "../components/HomeButton.js";
import ProgressCircles from "../components/ProgressCircles.js";
import { has_errors, MAX_STATIONS } from "../lib/form_checks.js";
import ArrivalsPage from "../review/ArrivalsPage.js";
import BasicsPage from "../review/BasicsPage.js";
import SimSettingsPage from "../review/SimSettingsPage.js";
import StationPage from "../review/StationPage.js";
import SummaryPage from "../review/SummaryPage.js";
import { useDraftRun } from "../state/DraftRunContext.js";

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
    const { draft, errors, edit_field, go_to_page } = useDraftRun();
    const insets = useSafeAreaInsets();

    const pages = draft === null ? [] : build_pages(draft);
    const current = Math.min(draft?.page ?? 0, Math.max(pages.length - 1, 0));

    // the header back arrow and Android's back button go to the previous page; on the first page they go back to the intro.
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

    return (
        <View style={styles.screen}>
            {/* the run's name in the header; iOS swipe-back only on the first page, since later pages go back a page instead */}
            <Stack.Screen
                options={{
                    title: draft.name ?? "Review",
                    gestureEnabled: current === 0,
                    headerRight: () => <HomeButton disable_prevention={disable_prevention} />,
                }}
            />

            <ProgressCircles pages={circles} current={current} on_jump={go_to_page} />
            <Text style={styles.title}>{page.name}</Text>

            {/* a new key per page starts each page scrolled to the top */}
            <ScrollView key={current} style={styles.body} contentContainerStyle={styles.body_content} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
                {content}
            </ScrollView>

            <View style={[styles.bar, { paddingBottom: 12 + insets.bottom }]}>
                <Pressable
                    style={[styles.button, button_disabled && styles.button_disabled]}
                    onPress={press_button}
                    disabled={button_disabled}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: button_disabled }}
                >
                    <Text style={styles.button_text}>{button_text}</Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#f7f7f7" },
    title: { fontSize: 22, fontWeight: "600", color: "#1a1a1a", paddingHorizontal: 20, paddingTop: 4, paddingBottom: 4 },
    body: { flex: 1 },
    body_content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 },
    bar: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#e2e2e2", backgroundColor: "#fff" },
    button: { minHeight: 52, borderRadius: 8, backgroundColor: "#1d5fd1", alignItems: "center", justifyContent: "center" },
    button_disabled: { backgroundColor: "#9bb3e0" },
    button_text: { fontSize: 18, fontWeight: "600", color: "#fff" },
});
