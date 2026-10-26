import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Gradient from "./Gradient.js";
import { FONTS } from "./theme.js";
import { useTheme, useThemedStyles } from "./ThemeContext.js";

const SIDE_PADDING = 20;
const VERTICAL_PADDING = 12;
const LINE = 10;   // thickness of the bar

/**
 * A progress bar across the screen with one circle per review page. Tapping a circle jumps to that page.
 * The bar fills up to the current page. Red means the page has problems; amber means it still has starred fields.
 * Circles shrink when there are many pages so they always fit the width.
 *
 * @param {{name: string, status: string|null}[]} pages - status is "error", "starred" or null.
 * @param {number} current - Index of the page being shown.
 * @param {Function} on_jump - Called with the tapped page's index.
 */
export default function ProgressCircles({ pages, current, on_jump })
{
    const { CURRENT_GLOW } = useTheme();
    const styles = useThemedStyles(make_styles);
    const { width } = useWindowDimensions();
    const n = pages.length;
    // at most 30 across, at least 14; circles take about 70% of the space so the bar shows between them
    const size = Math.max(14, Math.min(30, Math.floor((width - 2 * SIDE_PADDING) / n * 0.7)));
    const show_numbers = size >= 22;
    const filled = n > 1 ? current / (n - 1) : 0;
    // tiny circles still get a finger-sized tap area
    const slop = Math.max(0, Math.floor((44 - size) / 2));

    return (
        <View style={[styles.bar, { height: size + 2 * VERTICAL_PADDING }]}>
            {/* the line runs from the first circle's center to the last one's */}
            <View style={[styles.track, { left: SIDE_PADDING + size / 2, right: SIDE_PADDING + size / 2, top: VERTICAL_PADDING + (size - LINE) / 2 }]}>
                <Gradient name="button" style={[styles.fill, { width: `${filled * 100}%` }]} />
            </View>

            <View style={styles.row}>
                {pages.map((page, i) =>
                {
                    const is_current = i === current;
                    const is_done = i < current;
                    const status_text = page.status === "error" ? ", has problems" : page.status === "starred" ? ", has values to check" : "";
                    // red and amber pages always show their color; other pages reached so far are lime, like the bar
                    const fill = page.status ?? (is_done || is_current ? "button" : null);
                    return (
                        <Pressable
                            key={i}
                            onPress={() => on_jump(i)}
                            hitSlop={slop}
                            style={[
                                styles.circle,
                                { width: size, height: size, borderRadius: size / 2 },
                                is_current && CURRENT_GLOW,
                            ]}
                            accessibilityRole="button"
                            accessibilityState={{ selected: is_current }}
                            accessibilityLabel={`Page ${i + 1}: ${page.name}${status_text}`}
                        >
                            {/* rounded itself rather than clipped by the circle, so the current page's glow isn't cut off */}
                            {fill ? <Gradient name={fill} style={[StyleSheet.absoluteFill, { borderRadius: size / 2 }]} /> : null}
                            {show_numbers ? (
                                // the circle has a fixed size, so the number can only grow a little with the phone's text size
                                <Text style={[styles.number, fill && styles.number_filled]} maxFontSizeMultiplier={1.2}>{i + 1}</Text>
                            ) : null}
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}

const make_styles = ({ COLORS }) => StyleSheet.create({
    bar: { justifyContent: "center" },
    track: { position: "absolute", height: LINE, borderRadius: LINE / 2, backgroundColor: COLORS.track },
    fill: { height: LINE, borderRadius: LINE / 2 },
    row: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: SIDE_PADDING },
    // no outlines: pages not reached yet are the same color as the empty bar
    circle: { backgroundColor: COLORS.track, alignItems: "center", justifyContent: "center" },
    number: { fontSize: 13, fontFamily: FONTS.semibold, color: COLORS.text_muted },
    // dark ink on the lime, red and amber fills, in both themes
    number_filled: { color: COLORS.on_accent },
});
