import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { COLORS } from "./theme.js";

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
                <View style={[styles.fill, { width: `${filled * 100}%` }]} />
            </View>

            <View style={styles.row}>
                {pages.map((page, i) =>
                {
                    const is_current = i === current;
                    const is_done = i < current;
                    const status_text = page.status === "error" ? ", has problems" : page.status === "starred" ? ", has values to check" : "";
                    return (
                        <Pressable
                            key={i}
                            onPress={() => on_jump(i)}
                            hitSlop={slop}
                            style={[
                                styles.circle,
                                { width: size, height: size, borderRadius: size / 2 },
                                (is_done || is_current) && styles.reached,
                                is_done && styles.done,
                                page.status === "starred" && styles.starred,
                                page.status === "error" && styles.error,
                                is_current && styles.current,
                            ]}
                            accessibilityRole="button"
                            accessibilityState={{ selected: is_current }}
                            accessibilityLabel={`Page ${i + 1}: ${page.name}${status_text}`}
                        >
                            {show_numbers ? (
                                // the circle has a fixed size, so the number can only grow a little with the phone's text size
                                <Text style={[styles.number, is_done && !page.status && styles.number_done]} maxFontSizeMultiplier={1.2}>{i + 1}</Text>
                            ) : null}
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    bar: { justifyContent: "center" },
    track: { position: "absolute", height: LINE, borderRadius: LINE / 2, backgroundColor: COLORS.track },
    fill: { height: LINE, borderRadius: LINE / 2, backgroundColor: COLORS.accent },
    row: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: SIDE_PADDING },
    circle: { borderWidth: 2, borderColor: COLORS.border, backgroundColor: COLORS.surface, alignItems: "center", justifyContent: "center" },
    reached: { borderColor: COLORS.accent },
    done: { backgroundColor: COLORS.accent },
    starred: { borderColor: COLORS.starred, backgroundColor: COLORS.starred_light },
    error: { borderColor: COLORS.error, backgroundColor: COLORS.error_light },
    current: { borderWidth: 4 },
    number: { fontSize: 13, fontWeight: "600", color: COLORS.text },
    number_done: { color: COLORS.on_accent },
});
