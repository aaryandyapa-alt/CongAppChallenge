import { Redirect, Stack, router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import HomeButton from "../components/HomeButton.js";
import IntroPage from "../review/IntroPage.js";
import { useDraftRun } from "../state/DraftRunContext.js";
import { COLORS } from "../components/theme.js";

/**
 * The screen between starting a run (New run, the questions, or Duplicate) and the review pages.
 * It only shows a message that depends on how the run started, then Continue opens the review.
 */
export default function IntroScreen()
{
    const { draft } = useDraftRun();
    const insets = useSafeAreaInsets();

    // opened with no run being set up (for example from a stale link)
    if (draft === null)
        return <Redirect href="/" />;

    return (
        <View style={styles.screen}>
            <Stack.Screen options={{ headerRight: () => <HomeButton /> }} />
            <ScrollView contentContainerStyle={styles.body}>
                <IntroPage draft={draft} />
            </ScrollView>
            <View style={[styles.bar, { paddingBottom: 12 + insets.bottom }]}>
                <Pressable style={styles.button} onPress={() => router.push("/review")} accessibilityRole="button">
                    <Text style={styles.button_text}>Continue</Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: COLORS.background },
    body: { padding: 20 },
    bar: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.divider, backgroundColor: COLORS.surface },
    button: { minHeight: 52, borderRadius: 8, backgroundColor: COLORS.accent, alignItems: "center", justifyContent: "center" },
    button_text: { fontSize: 18, fontWeight: "600", color: COLORS.on_accent },
});
