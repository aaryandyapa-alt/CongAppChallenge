import { StyleSheet, Text, View } from "react-native";

import Gradient from "../components/Gradient.js";
import PrimaryButton from "../components/PrimaryButton.js";
import { CENTERED_TEXT, FONTS, RADIUS } from "../components/theme.js";
import { useThemedStyles } from "../components/ThemeContext.js";
import { SCENARIOS, TITLES } from "../lib/result_sentences.js";

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/**
 * The first results page: what the app did, in three short lines, so it's clear before the numbers.
 * Kept short on purpose (a longer version confused testers).
 *
 * @param {object} output - The run's output.json (the current split gives the number of workers).
 * @param {Function} on_continue - "See my results": goes to the first results page.
 */
export default function HowItWorksPage({ output, on_continue })
{
    const styles = useThemedStyles(make_styles);
    const workers = output["current"]["workers"].reduce((sum, w) => sum + w, 0);
    // the three goals, as named on their results pages (the current setup isn't one)
    const goals = SCENARIOS.filter((key) => key !== "current").map((key) => TITLES[key]);

    const steps = [
        "We simulated a day at your site.",
        `We tried moving your ${plural(workers, "worker", "workers")} between stations.`,
        "We found the best setup for each goal:",
    ];

    return (
        <>
            <Text style={styles.title} accessibilityRole="header">Here&apos;s what we did</Text>

            <View style={styles.card}>
                {steps.map((text, i) => (
                    <View key={text} style={styles.step}>
                        <Gradient name="button" style={styles.number}>
                            <Text style={styles.number_text}>{i + 1}</Text>
                        </Gradient>
                        <Text style={styles.step_text}>{text}</Text>
                    </View>
                ))}
                {/* the goals, as small lime labels under the last step */}
                <View style={styles.goals}>
                    {goals.map((goal) => <Text key={goal} style={styles.goal}>{goal}</Text>)}
                </View>
            </View>

            <PrimaryButton label="See my results" icon="arrow-forward" on_press={on_continue} style={styles.button} />
        </>
    );
}

const make_styles = ({ COLORS, CARD_SHADOW }) => StyleSheet.create({
    title: { fontSize: 26, fontFamily: FONTS.extrabold, color: COLORS.text, marginBottom: 18, letterSpacing: -0.5, lineHeight: 32 },
    // one glass card with the three steps
    card: {
        padding: 20, gap: 16, borderRadius: RADIUS.panel,
        backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.glass_edge, ...CARD_SHADOW,
    },
    step: { flexDirection: "row", alignItems: "center", gap: 14 },
    // the step number in a small lime circle
    number: { width: 32, height: 32, borderRadius: 16, overflow: "hidden", alignItems: "center", justifyContent: "center" },
    number_text: { fontSize: 15, fontFamily: FONTS.extrabold, color: COLORS.on_accent },
    step_text: { flex: 1, fontSize: 17, lineHeight: 24, fontFamily: FONTS.semibold, color: COLORS.text },
    // lined up under the step text (past the number circle)
    goals: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginLeft: 46, marginTop: -6 },
    goal: {
        fontFamily: FONTS.semibold, fontSize: 13, color: COLORS.accent_deep,
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.pill, backgroundColor: COLORS.accent_tint, overflow: "hidden",
        ...CENTERED_TEXT,
    },
    button: { marginTop: 22 },
});
