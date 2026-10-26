import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RADIUS } from "./theme.js";
import { useThemedStyles } from "./ThemeContext.js";

const SIDE = 12;

/**
 * The floating cream panel at the bottom of a screen that holds its buttons (Next, Submit, Continue, View results).
 * It floats over the page, above the bottom edge (and the phone's home indicator) with rounded corners like the
 * tab bar, so the page scrolls underneath it. Put it last inside a view with no padding that the page fills,
 * and give the page's scroll content bottom padding of the height it reports, so the end of the page can scroll clear.
 *
 * @param {Function} on_height - Called with the space it takes up from the bottom of its parent (optional).
 * @param {object} style - Extra styles, e.g. { flexDirection: "row" } to put the buttons side by side (optional).
 */
export default function BottomBar({ on_height, style, children })
{
    const styles = useThemedStyles(make_styles);
    const insets = useSafeAreaInsets();
    const bottom = Math.max(insets.bottom, 12);

    return (
        <View
            style={[styles.bar, { bottom: bottom }, style]}
            onLayout={on_height ? (e) => on_height(e.nativeEvent.layout.height + bottom) : undefined}
        >
            {children}
        </View>
    );
}

const make_styles = ({ COLORS, PANEL_SHADOW }) => StyleSheet.create({
    bar: {
        position: "absolute", left: SIDE, right: SIDE, padding: 12, gap: 10,
        // solid cream (the page's own color, like the tab bar), so the page doesn't show through as it scrolls under
        borderRadius: RADIUS.panel, backgroundColor: COLORS.background, ...PANEL_SHADOW,
    },
});
