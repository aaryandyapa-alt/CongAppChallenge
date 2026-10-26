import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import GlowBackground from "./GlowBackground.js";
import Gradient from "./Gradient.js";
import { FONTS, RADIUS } from "./theme.js";
import { useTheme, useThemedStyles } from "./ThemeContext.js";

/**
 * A spinner with a message on a glass card, for "Generating values" and "Simulating".
 * The spinner is drawn by the phone itself, so it keeps moving even while the app's JavaScript is busy simulating.
 * Simulating also passes progress and status lines, which update between the simulation's short pauses.
 *
 * @param {string} message - The main line, like "Simulating".
 * @param {string} detail - A smaller line at the bottom (optional).
 * @param {number|null} progress - 0 to 1 to show a progress bar, or null/undefined for none.
 * @param {string} status - What's happening now, like "Fine-tuning for the shortest average wait" (optional).
 * @param {string} status_detail - A line explaining the status (optional).
 * @param {string} note - A small line that changes often, like the split being tried (optional).
 * @param {string} footer - A line pinned to the bottom of the screen (optional).
 * @param {ReactNode} top - Drawn at the top of the screen, over the glow, like a TopBar with a back button (optional).
 */
export default function LoadingScreen({ message, detail, progress, status, status_detail, note, footer, top })
{
    const { COLORS } = useTheme();
    const styles = useThemedStyles(make_styles);
    const insets = useSafeAreaInsets();
    const has_progress = typeof progress === "number";
    const percent = has_progress ? Math.round(progress * 100) : 0;

    return (
        <View style={styles.screen}>
            <GlowBackground />
            {top}
            <View style={[styles.middle, !top && { paddingTop: insets.top + 24 }]}>
                <View style={styles.card}>
                    <Gradient name="soft" style={styles.spinner_circle}>
                        <ActivityIndicator size="large" color={COLORS.accent_text} />
                    </Gradient>
                    <Text style={styles.message}>{message}</Text>

                    {has_progress ? (
                        <View style={styles.progress_block}>
                            <View
                                style={styles.track}
                                accessibilityRole="progressbar"
                                accessibilityLabel="Simulation progress"
                                accessibilityValue={{ min: 0, max: 100, now: percent }}
                            >
                                <Gradient name="button" style={[styles.fill, { width: `${percent}%` }]} />
                            </View>
                            <Text style={styles.percent}>About {percent}% done</Text>
                        </View>
                    ) : null}

                    {/* only the status is announced to screen readers: it changes a few times, the note changes constantly */}
                    {status ? <Text style={styles.status} accessibilityLiveRegion="polite">{status}</Text> : null}
                    {status_detail ? <Text style={styles.status_detail}>{status_detail}</Text> : null}
                    {note ? <Text style={styles.note} numberOfLines={2}>{note}</Text> : null}

                    {detail ? <Text style={styles.detail}>{detail}</Text> : null}
                </View>
            </View>

            {footer ? <Text style={[styles.footer, { paddingBottom: 24 + insets.bottom }]}>{footer}</Text> : null}
        </View>
    );
}

const make_styles = ({ COLORS, EYEBROW, CARD_SHADOW }) => StyleSheet.create({
    screen: { flex: 1, backgroundColor: COLORS.background },
    // the card, centered in the space above the footer
    middle: { flex: 1, justifyContent: "center", padding: 20 },
    card: {
        alignItems: "center", gap: 14, paddingHorizontal: 24, paddingVertical: 30, borderRadius: RADIUS.panel,
        backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.glass_edge, ...CARD_SHADOW,
    },
    spinner_circle: { width: 76, height: 76, borderRadius: 38, overflow: "hidden", alignItems: "center", justifyContent: "center", marginBottom: 4 },
    footer: { fontFamily: FONTS.regular, fontSize: 14, lineHeight: 20, color: COLORS.text_muted, textAlign: "center", paddingHorizontal: 32, paddingTop: 12 },
    message: { fontSize: 24, fontFamily: FONTS.extrabold, color: COLORS.text, textAlign: "center", letterSpacing: -0.4 },
    progress_block: { alignSelf: "stretch", gap: 8, marginTop: 4 },
    track: { height: 10, borderRadius: RADIUS.pill, backgroundColor: COLORS.track, overflow: "hidden" },
    fill: { height: 10, borderRadius: RADIUS.pill },
    percent: { ...EYEBROW, textAlign: "center" },
    status: { fontSize: 17, fontFamily: FONTS.bold, color: COLORS.text, textAlign: "center", marginTop: 4 },
    status_detail: { fontFamily: FONTS.regular, fontSize: 15, lineHeight: 21, color: COLORS.text_secondary, textAlign: "center", marginTop: -6 },
    note: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.text_faint, textAlign: "center" },
    detail: { fontFamily: FONTS.regular, fontSize: 15, lineHeight: 21, color: COLORS.text_muted, textAlign: "center" },
});
