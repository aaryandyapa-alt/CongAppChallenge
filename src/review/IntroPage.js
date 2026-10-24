import { StyleSheet, Text } from "react-native";

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
 * The message shown before the review pages. Used by src/app/intro.js, which has the Continue button.
 */
export default function IntroPage({ draft })
{
    return (
        <>
            <Text style={styles.message}>{MESSAGES[draft.start_state] ?? MESSAGES["skipped"]}</Text>
            <Text style={styles.how_to}>{HOW_TO}</Text>
        </>
    );
}

const styles = StyleSheet.create({
    message: { fontSize: 20, lineHeight: 28, color: "#1a1a1a", marginTop: 24, marginBottom: 16 },
    how_to: { fontSize: 16, lineHeight: 22, color: "#555" },
});
