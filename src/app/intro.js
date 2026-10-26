import { Redirect, router } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import BottomBar from "../components/BottomBar.js";
import GlowBackground from "../components/GlowBackground.js";
import HomeButton from "../components/HomeButton.js";
import PrimaryButton from "../components/PrimaryButton.js";
import { BackButton } from "../components/RoundButton.js";
import TopBar from "../components/TopBar.js";
import IntroPage from "../review/IntroPage.js";
import { useDraftRun } from "../state/DraftRunContext.js";
import { useThemedStyles } from "../components/ThemeContext.js";

/**
 * The screen between starting a run (New run, the questions, or Duplicate) and the review pages.
 * It only shows a message that depends on how the run started, then Continue opens the review.
 */
export default function IntroScreen()
{
    const styles = useThemedStyles(make_styles);
    const { draft } = useDraftRun();
    // how much of the bottom the floating Continue bar covers; the page gets that much room at its end
    const [bar_height, set_bar_height] = useState(0);

    // opened with no run being set up (for example from a stale link)
    if (draft === null)
        return <Redirect href="/" />;

    return (
        <View style={styles.screen}>
            <GlowBackground />
            <TopBar left={<BackButton />} right={<HomeButton />} eyebrow={draft.name} title="Before you start" />
            <ScrollView contentContainerStyle={[styles.body, { paddingBottom: bar_height + 20 }]}>
                <IntroPage draft={draft} />
            </ScrollView>
            <BottomBar on_height={set_bar_height}>
                <PrimaryButton label="Continue" on_press={() => router.push("/review")} />
            </BottomBar>
        </View>
    );
}

const make_styles = ({ COLORS }) => StyleSheet.create({
    screen: { flex: 1, backgroundColor: COLORS.background },
    // the bottom padding (room for the floating bar) is added in the component
    body: { paddingHorizontal: 20, paddingTop: 16 },
});
