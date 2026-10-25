import { Link, router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

import { DEV_PRESETS } from "../../lib/dev_presets.js";
import { useDraftRun } from "../../state/DraftRunContext.js";

// placeholder until step 9; the links and presets are temporary, so every screen can be opened while building
export default function HomeScreen()
{
    const { begin_duplicate, set_name, go_to_page } = useDraftRun();

    // loads a ready-made run as a Simple draft and opens its Summary page, one tap from Start simulation
    function load_preset(preset)
    {
        const now = new Date();
        const stamp = [now.getHours(), now.getMinutes(), now.getSeconds()].map((n) => String(n).padStart(2, "0")).join("");
        begin_duplicate("simple", preset.schema);
        // a new name each time, so saved runs don't collide
        set_name(`${preset.short} preset ${stamp}`);
        // past the last page; review.js shows the last page (Summary)
        go_to_page(999);
        router.push("/review");
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text>Home</Text>
            <Link href="/new-run">New run</Link>
            <Link href="/questions">Questions</Link>
            <Link href="/generating">Generating values</Link>
            <Link href="/review">Review</Link>
            <Link href="/simulating">Simulating</Link>
            <Link href="/runs/test-1">Saved run: test-1</Link>
            <Link href="/results/test-1">Results: test-1</Link>
            <Link href="/dev-components">Component test</Link>

            <Text style={styles.heading}>Test presets</Text>
            {DEV_PRESETS.map((p) => (
                <Pressable key={p.short} style={styles.preset} onPress={() => load_preset(p)} accessibilityRole="button">
                    <Text style={styles.preset_text}>{p.label}</Text>
                </Pressable>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flexGrow: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 20 },
    heading: { marginTop: 16, fontWeight: "600" },
    preset: { minHeight: 44, paddingHorizontal: 16, justifyContent: "center", borderRadius: 8, borderWidth: 2, borderColor: "#1d5fd1" },
    preset_text: { color: "#1d5fd1", fontSize: 15 },
});
