import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import BottomBar from "../../components/BottomBar.js";
import ConfirmDialog from "../../components/ConfirmDialog.js";
import GlowBackground from "../../components/GlowBackground.js";
import OutlineButton from "../../components/OutlineButton.js";
import PrimaryButton from "../../components/PrimaryButton.js";
import { BackButton } from "../../components/RoundButton.js";
import TopBar from "../../components/TopBar.js";
import { format_date_time } from "../../components/TimeInput.js";
import { schema_to_form } from "../../lib/form_to_schema.js";
import SummaryPage from "../../review/SummaryPage.js";
import { useDraftRun } from "../../state/DraftRunContext.js";
import { delete_run, load_info, load_input } from "../../storage.js";
import { FONTS, RADIUS } from "../../components/theme.js";
import { useThemedStyles } from "../../components/ThemeContext.js";

/**
 * A saved run: its inputs, plus View results, Duplicate and Delete.
 */
export default function SavedRunScreen()
{
    const styles = useThemedStyles(make_styles);
    const { name } = useLocalSearchParams();
    const { begin_duplicate } = useDraftRun();
    // null while loading, then { input, info }, or { missing: true }
    const [run, set_run] = useState(null);
    // the "Delete this run?" box is open
    const [asking, set_asking] = useState(false);
    // how much of the bottom the floating buttons cover; the page gets that much room at its end
    const [bar_height, set_bar_height] = useState(0);

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
            <View style={styles.screen}>
                <TopBar left={<BackButton />} title={name} />
                <View style={styles.missing}>
                    <Text style={styles.missing_text}>This run couldn&apos;t be found.</Text>
                </View>
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

    function delete_this_run()
    {
        set_asking(false);
        delete_run(name);
        router.back();
    }

    return (
        <View style={styles.screen}>
            <GlowBackground />
            <TopBar left={<BackButton />} eyebrow="Saved run" title={name} />
            <ScrollView contentContainerStyle={[styles.body, { paddingBottom: bar_height + 20 }]}>
                {/* when it was run and its mode, as soft chips under the title */}
                <View style={styles.chips}>
                    {[format_date_time(run.info?.date_run), mode === "pro" ? "Advanced" : "Simple"].filter(Boolean).map((text) => (
                        <Text key={text} style={styles.chip}>{text}</Text>
                    ))}
                </View>
                {/* the same summary the user saw before simulating; a saved run has no problems to show */}
                <SummaryPage draft={{ form: form, mode: mode }} errors={{}} station_count={form.stations.length} saved />
            </ScrollView>

            <BottomBar on_height={set_bar_height}>
                <PrimaryButton label="View results" on_press={() => router.push({ pathname: "/results/[name]", params: { name: name } })} />
                <View style={styles.row}>
                    <OutlineButton
                        label="Duplicate"
                        icon="copy-outline"
                        on_press={duplicate}
                        compact
                        style={styles.half}
                        hint="Copies this run so you can change it and simulate again"
                    />
                    <OutlineButton label="Delete" icon="trash-outline" on_press={() => set_asking(true)} danger compact style={styles.half} />
                </View>
            </BottomBar>

            <ConfirmDialog
                visible={asking}
                icon="trash-outline"
                title="Delete this run?"
                message={`"${name}" and its results will be deleted. This can't be undone.`}
                cancel_label="Cancel"
                confirm_label="Delete"
                danger
                on_cancel={() => set_asking(false)}
                on_confirm={delete_this_run}
            />
        </View>
    );
}

const make_styles = ({ COLORS }) => StyleSheet.create({
    screen: { flex: 1, backgroundColor: COLORS.background },
    // the bottom padding (room for the floating bar) is added in the component
    body: { paddingHorizontal: 20 },
    // right under the title, lined up with it
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6, marginBottom: 18, paddingHorizontal: 2 },
    chip: {
        fontFamily: FONTS.semibold, fontSize: 13, color: COLORS.accent_deep,
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.pill, backgroundColor: COLORS.accent_tint, overflow: "hidden",
    },
    row: { flexDirection: "row", gap: 10 },
    half: { flex: 1 },
    missing: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
    missing_text: { fontFamily: FONTS.regular, fontSize: 17, color: COLORS.text, textAlign: "center" },
});
