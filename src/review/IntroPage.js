import { StyleSheet, Text, View } from "react-native";
import { FONTS, RADIUS } from "../components/theme.js";
import { useThemedStyles } from "../components/ThemeContext.js";

const HOW_TO = "Next, you'll go through a few pages describing how your site runs. Tap Next to move through them, or tap a circle on the progress bar to jump to one.";

// the message depends on how the run started (draft.start_state)
const MESSAGES = {
    "pro": "Fill in each page to describe how your site runs.",
    "skipped": "Fill in each page to describe how your site runs.",
    "duplicate": "This is a copy of a saved run. Change anything you like, then start the simulation.",
    "ai-full": "We've filled in every page from your answers. Please double-check each value, since the AI can make mistakes.",
    "ai-partial": "We've filled in what we could from your answers. Fields marked with ★ couldn't be worked out and were given a default value, so please review and fix them.",
    "ai-failed": "We didn't catch anything from your answers, so please fill in each page yourself.",
};

/**
 * The message shown before the review pages, on a glass card. Used by src/app/intro.js, which has the Continue button.
 */
export default function IntroPage({ draft })
{
    const styles = useThemedStyles(make_styles);
    return (
        <View style={styles.card}>
            <Text style={styles.message}>{MESSAGES[draft.start_state] ?? MESSAGES["skipped"]}</Text>
            <View style={styles.divider} />
            <Text style={styles.eyebrow}>How it works</Text>
            <Text style={styles.how_to}>{HOW_TO}</Text>
        </View>
    );
}

const make_styles = ({ COLORS, EYEBROW, CARD_SHADOW }) => StyleSheet.create({
    card: {
        padding: 22, gap: 12, borderRadius: RADIUS.panel,
        backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.glass_edge, ...CARD_SHADOW,
    },
    message: { fontFamily: FONTS.semibold, fontSize: 19, lineHeight: 28, color: COLORS.text },
    divider: { height: 1, backgroundColor: COLORS.divider, marginVertical: 4 },
    eyebrow: { ...EYEBROW },
    how_to: { fontFamily: FONTS.regular, fontSize: 16, lineHeight: 24, color: COLORS.text_muted },
});
