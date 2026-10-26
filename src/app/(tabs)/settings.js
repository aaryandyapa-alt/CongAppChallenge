import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@react-native-vector-icons/ionicons";

import BrandHeader from "../../components/BrandHeader.js";
import ConfirmDialog from "../../components/ConfirmDialog.js";
import GlowBackground from "../../components/GlowBackground.js";
import Gradient from "../../components/Gradient.js";
import Logo from "../../components/Logo.js";
import OutlineButton from "../../components/OutlineButton.js";
import ToggleSwitch from "../../components/ToggleSwitch.js";
import { DEV_PRESETS } from "../../lib/dev_presets.js";
import { useDraftRun } from "../../state/DraftRunContext.js";
import { useSettings } from "../../state/SettingsContext.js";
import { delete_run, list_runs } from "../../storage.js";
import { CENTERED_TEXT, FONTS, RADIUS, TAB_BAR } from "../../components/theme.js";
import { useTheme, useThemedStyles } from "../../components/ThemeContext.js";

// the Appearance choices (setting "appearance"; see components/ThemeContext.js)
const APPEARANCES = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "system", label: "System" },
];

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
    const { COLORS } = useTheme();
    const styles = useThemedStyles(make_styles);
    const { begin_duplicate, set_name, go_to_page } = useDraftRun();
    const { settings, change_setting } = useSettings();
    const insets = useSafeAreaInsets();
    // the Developer section starts closed so it stays out of the way
    const [developer_open, set_developer_open] = useState(false);
    // the Delete all runs box, and how many runs there were when it was opened
    // (kept after closing, so the box's text doesn't change while it fades out)
    const [delete_box, set_delete_box] = useState({ open: false, count: 0 });

    // opens "Delete all runs?", or "No runs to delete" when there are none
    function ask_delete_all()
    {
        set_delete_box({ open: true, count: list_runs().length });
    }

    function close_delete_box()
    {
        set_delete_box({ ...delete_box, open: false });
    }

    function delete_all()
    {
        for (const name of list_runs())
            delete_run(name);
        close_delete_box();
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
        <View style={styles.screen}>
            <GlowBackground />
            <BrandHeader />
            {/* room at the bottom for the floating tab bar, which covers the end of the page */}
            <ScrollView contentContainerStyle={[styles.page, { paddingBottom: insets.bottom + TAB_BAR.gap + TAB_BAR.height + 24 }]}>
                <Text style={styles.heading}>Display</Text>
                <View style={styles.card}>
                    <Text style={styles.setting_label}>Appearance</Text>
                    {/* a pill switch like New run's mode picker; the chosen one is a lime pill */}
                    <View style={styles.segments} accessibilityRole="radiogroup" accessibilityLabel="Appearance">
                        {APPEARANCES.map((a) =>
                        {
                            const selected = settings["appearance"] === a.value;
                            return (
                                <Pressable
                                    key={a.value}
                                    onPress={() => change_setting("appearance", a.value)}
                                    style={styles.segment}
                                    accessibilityRole="radio"
                                    accessibilityState={{ checked: selected }}
                                >
                                    {selected ? <Gradient name="button" style={StyleSheet.absoluteFill} /> : null}
                                    <Text style={[styles.segment_text, selected && styles.segment_text_selected]}>{a.label}</Text>
                                </Pressable>
                            );
                        })}
                    </View>
                    <Text style={styles.setting_note}>System follows your phone&apos;s light or dark setting.</Text>
                </View>
                {SWITCHES.map((s) => (
                    <View key={s.key} style={[styles.card, styles.setting_row]}>
                        <View style={styles.setting_text}>
                            <Text style={styles.setting_label}>{s.label}</Text>
                            <Text style={styles.setting_note}>{s.note}</Text>
                        </View>
                        <ToggleSwitch value={settings[s.key]} on_change={(v) => change_setting(s.key, v)} label={s.label} />
                    </View>
                ))}

                <Text style={styles.heading}>About</Text>
                <View style={styles.card}>
                    {/* the full-color logo (its on-dark version in dark mode) */}
                    <Logo height={44} style={styles.about_logo} />
                    <Text style={styles.about}>
                        ShiftLime is a queue planner for food banks, pantries and clinics. Describe how people move through your site, and it tests every way to split your workers to show which works better.
                    </Text>
                    <Text style={styles.about}>Built for the Congressional App Challenge.</Text>
                    <OutlineButton label="Replay tutorial" icon="play-circle-outline" on_press={() => router.push("/tutorial")} compact style={styles.replay} />
                </View>

                <Text style={styles.heading}>Saved runs</Text>
                <OutlineButton label="Delete all runs" on_press={ask_delete_all} danger />

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
                            <ToggleSwitch value={settings["show_timings"]} on_change={(v) => change_setting("show_timings", v)} label="Show timings" />
                        </View>
                        <View style={styles.divider} />
                        <Text style={styles.dev_note}>Load a test run on its Summary page, then tap Start simulation.</Text>
                        {DEV_PRESETS.map((p) => (
                            <OutlineButton key={p.short} label={p.label} on_press={() => load_preset(p)} compact />
                        ))}
                    </View>
                ) : null}
            </ScrollView>

            {delete_box.count === 0 ? (
                <ConfirmDialog
                    visible={delete_box.open}
                    icon="folder-open-outline"
                    title="No runs to delete"
                    message="You don't have any saved runs yet."
                    cancel_label="OK"
                    on_cancel={close_delete_box}
                />
            ) : (
                <ConfirmDialog
                    visible={delete_box.open}
                    icon="trash-outline"
                    title="Delete all runs?"
                    message={`All ${delete_box.count === 1 ? "1 saved run" : `${delete_box.count} saved runs`} and their results will be deleted. This can't be undone.`}
                    cancel_label="Cancel"
                    confirm_label="Delete all"
                    danger
                    on_cancel={close_delete_box}
                    on_confirm={delete_all}
                />
            )}
        </View>
    );
}

const make_styles = ({ COLORS, EYEBROW, CARD_SHADOW }) => StyleSheet.create({
    screen: { flex: 1, backgroundColor: COLORS.background },
    page: { paddingHorizontal: 20, paddingTop: 12, gap: 12 },
    // small uppercase section labels
    heading: { ...EYEBROW, marginTop: 14, paddingHorizontal: 4 },
    // glass cards
    card: {
        padding: 18, gap: 10, borderRadius: RADIUS.card,
        backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.glass_edge, ...CARD_SHADOW,
    },
    about: { fontFamily: FONTS.regular, fontSize: 16, lineHeight: 23, color: COLORS.text },
    about_logo: { marginBottom: 4 },
    replay: { marginTop: 4 },
    setting_row: { flexDirection: "row", alignItems: "center", gap: 12 },
    setting_text: { flex: 1, gap: 4 },
    setting_label: { fontSize: 16, fontFamily: FONTS.bold, color: COLORS.text },
    setting_note: { fontFamily: FONTS.regular, fontSize: 14, lineHeight: 20, color: COLORS.text_faint },
    // the Appearance pill switch (the same look as New run's mode picker)
    segments: { flexDirection: "row", padding: 4, borderRadius: RADIUS.pill, backgroundColor: COLORS.segment_track },
    segment: { flex: 1, minHeight: 44, alignItems: "center", justifyContent: "center", borderRadius: RADIUS.pill, overflow: "hidden" },
    segment_text: { fontFamily: FONTS.semibold, fontSize: 15, color: COLORS.text_muted, ...CENTERED_TEXT },
    segment_text_selected: { fontFamily: FONTS.bold, color: COLORS.on_accent },
    // the heading row is the tap target, so it gets a finger-sized height
    dropdown_heading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 44 },
    divider: { height: 1, backgroundColor: COLORS.divider, marginVertical: 4 },
    dev_note: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.text_faint },
});
