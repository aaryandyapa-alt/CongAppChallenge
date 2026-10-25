import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "./theme.js";

/**
 * A spinner with a message, for "Generating values" and "Simulating".
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
 */
export default function LoadingScreen({ message, detail, progress, status, status_detail, note, footer })
{
    const insets = useSafeAreaInsets();
    const has_progress = typeof progress === "number";
    const percent = has_progress ? Math.round(progress * 100) : 0;

    return (
        <View style={styles.screen}>
            <View style={styles.middle}>
                <ActivityIndicator size="large" color={COLORS.accent} />
                <Text style={styles.message}>{message}</Text>

                {has_progress ? (
                    <View style={styles.progress_block}>
                        <View
                            style={styles.track}
                            accessibilityRole="progressbar"
                            accessibilityLabel="Simulation progress"
                            accessibilityValue={{ min: 0, max: 100, now: percent }}
                        >
                            <View style={[styles.fill, { width: `${percent}%` }]} />
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

            {footer ? <Text style={[styles.footer, { paddingBottom: 24 + insets.bottom }]}>{footer}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: COLORS.background },
    // everything except the footer, centered in the space above it
    middle: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 16 },
    footer: { fontSize: 15, lineHeight: 21, color: COLORS.text_muted, textAlign: "center", paddingHorizontal: 32, paddingTop: 12 },
    message: { fontSize: 22, fontWeight: "600", color: COLORS.text, textAlign: "center" },
    progress_block: { alignSelf: "stretch", gap: 6 },
    track: { height: 12, borderRadius: 6, backgroundColor: COLORS.track, overflow: "hidden" },
    fill: { height: 12, borderRadius: 6, backgroundColor: COLORS.accent },
    percent: { fontSize: 15, color: COLORS.text_muted, textAlign: "center" },
    status: { fontSize: 18, fontWeight: "600", color: COLORS.text, textAlign: "center" },
    status_detail: { fontSize: 16, lineHeight: 22, color: COLORS.text_secondary, textAlign: "center", marginTop: -8 },
    note: { fontSize: 14, color: COLORS.text_faint, textAlign: "center" },
    detail: { fontSize: 15, lineHeight: 21, color: COLORS.text_muted, textAlign: "center", marginTop: 8 },
});
