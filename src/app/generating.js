import { Redirect, router } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import GlowBackground from "../components/GlowBackground.js";
import LoadingScreen from "../components/LoadingScreen.js";
import OutlineButton from "../components/OutlineButton.js";
import PrimaryButton from "../components/PrimaryButton.js";
import { BackButton } from "../components/RoundButton.js";
import TopBar from "../components/TopBar.js";
import { extract } from "../lib/ai_client.js";
import { useDraftRun } from "../state/DraftRunContext.js";
import { FONTS, RADIUS } from "../components/theme.js";
import { useThemedStyles } from "../components/ThemeContext.js";

/**
 * "Generating values": sends the five answers to the AI in one call, fills the draft from the reply, then opens the intro.
 * The intro's message depends on what came back (everything, some fields, or no stations), via fill_from_ai.
 */
export default function GeneratingScreen()
{
    const styles = useThemedStyles(make_styles);
    const { draft, fill_from_ai, skip_questions } = useDraftRun();
    const [failed, set_failed] = useState(false);
    // bumped by Try again to send the answers again
    const [attempt, set_attempt] = useState(0);
    const answers = draft?.answers;

    useEffect(() =>
    {
        if (!answers)
            return;
        // if the user goes back while it's loading, ignore the reply
        let active = true;
        extract(answers)
            .then((result) =>
            {
                if (!active)
                    return;
                fill_from_ai(result.schema);
                // replace, so Back from the intro returns to the questions, not to this spinner
                router.replace("/intro");
            })
            .catch(() =>
            {
                if (active)
                    set_failed(true);
            });
        return () =>
        {
            active = false;
        };
    }, [answers, attempt, fill_from_ai]);

    // opened without submitted answers (for example from a stale link)
    if (!answers)
        return <Redirect href="/" />;

    if (failed)
    {
        return (
            <View style={styles.screen}>
                <GlowBackground />
                <TopBar left={<BackButton />} />
                <View style={styles.error_body}>
                    <View style={styles.error_card}>
                        <Text style={styles.error_title}>Couldn&apos;t reach the AI</Text>
                        <Text style={styles.error_text}>
                            Check your connection and try again, or fill in the pages yourself.
                        </Text>
                        <PrimaryButton
                            label="Try again"
                            on_press={() =>
                            {
                                set_failed(false);
                                set_attempt(attempt + 1);
                            }}
                        />
                        <OutlineButton
                            label="Fill in myself"
                            on_press={() =>
                            {
                                // the same as Skip: every page starts blank
                                skip_questions();
                                router.replace("/intro");
                            }}
                        />
                    </View>
                </View>
            </View>
        );
    }

    // no title bar, just a back button in the corner to cancel and return to the questions
    return (
        <LoadingScreen
            top={<TopBar left={<BackButton />} />}
            message="Generating values"
            detail="Reading your answers. This usually takes a few seconds."
        />
    );
}

const make_styles = ({ COLORS, CARD_SHADOW }) => StyleSheet.create({
    screen: { flex: 1, backgroundColor: COLORS.background },
    error_body: { flex: 1, padding: 20, justifyContent: "center" },
    // a glass card, like the loading card it replaces
    error_card: {
        padding: 24, gap: 14, borderRadius: RADIUS.panel,
        backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.glass_edge, ...CARD_SHADOW,
    },
    error_title: { fontSize: 24, fontFamily: FONTS.extrabold, color: COLORS.text, letterSpacing: -0.4 },
    error_text: { fontFamily: FONTS.regular, fontSize: 17, lineHeight: 25, color: COLORS.text_secondary, marginBottom: 6 },
});
