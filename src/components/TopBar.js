import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FONTS } from "./theme.js";
import { useThemedStyles } from "./ThemeContext.js";

/**
 * The top of a screen that has no header bar: round buttons in the corners (below the status bar),
 * then an optional small uppercase label and big title, all on the page's glowing background.
 *
 * @param {ReactNode} left - Usually <BackButton />, or <HomeButton /> (optional).
 * @param {ReactNode} right - Usually <HomeButton /> (optional).
 * @param {string} label - A small line between the buttons, like the run name on the results (optional).
 * @param {string} eyebrow - The small uppercase label above the title, like "New run" (optional).
 * @param {string} title - The big title under the buttons (optional).
 * @param {boolean} raised - A frosted glass bar with a soft shadow, separating it from a page that scrolls under it (Results).
 */
export default function TopBar({ left, right, label, eyebrow, title, raised })
{
    const styles = useThemedStyles(make_styles);
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.bar, raised && styles.raised, { paddingTop: insets.top + 8 }]}>
            <View style={styles.row}>
                {/* empty corners keep their space, so the label stays centered */}
                <View style={styles.corner}>{left}</View>
                {label ? <Text style={styles.label} numberOfLines={1}>{label}</Text> : <View style={styles.middle} />}
                <View style={[styles.corner, styles.corner_right]}>{right}</View>
            </View>
            {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
            {title ? <Text style={[styles.title, !eyebrow && styles.title_alone]} accessibilityRole="header">{title}</Text> : null}
        </View>
    );
}

const make_styles = ({ COLORS, EYEBROW, HEADER_SHADOW }) => StyleSheet.create({
    bar: { paddingHorizontal: 16, paddingBottom: 4 },
    // like Review's top: frosted glass edge to edge, above the page (zIndex) so the shadow isn't covered by it
    raised: { paddingBottom: 12, backgroundColor: COLORS.surface, zIndex: 1, ...HEADER_SHADOW },
    row: { flexDirection: "row", alignItems: "center", minHeight: 44 },
    corner: { width: 44 },
    corner_right: { alignItems: "flex-end" },
    middle: { flex: 1 },
    label: { ...EYEBROW, flex: 1, textAlign: "center", paddingHorizontal: 8 },
    eyebrow: { ...EYEBROW, marginTop: 14, paddingHorizontal: 4 },
    title: { fontSize: 30, fontFamily: FONTS.extrabold, color: COLORS.text, marginTop: 4, paddingHorizontal: 4, letterSpacing: -0.6, lineHeight: 36 },
    title_alone: { marginTop: 14 },
});
