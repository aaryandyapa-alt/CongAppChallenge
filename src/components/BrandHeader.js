import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Gradient from "./Gradient.js";
import Logo from "./Logo.js";
import { HEADER_STYLE } from "./theme.js";
import { useThemedStyles } from "./ThemeContext.js";

const LOGO_HEIGHT = 36;
const PADDING_TOP = 6;
const PADDING_BOTTOM = 10;

/**
 * The top of the tabs (Home and Settings), with the ShiftLime logo in its top-left corner. Two looks, picked by
 * HEADER_STYLE in theme.js: "green" (a lime band with a soft shadow under it, and the one-color green logo)
 * or "glass" (a frosted bar over the page's glow, and the full-color logo).
 */
export default function BrandHeader()
{
    const styles = useThemedStyles(make_styles);
    const insets = useSafeAreaInsets();
    const glass = HEADER_STYLE === "glass";

    const logo = (
        <View style={styles.logo} accessibilityRole="header">
            <Logo height={LOGO_HEIGHT} variant={glass ? "auto" : "mono"} />
        </View>
    );

    if (glass)
        return <View style={[styles.band, styles.glass, { paddingTop: insets.top + PADDING_TOP }]}>{logo}</View>;

    // the green band, with a soft dark shadow under it so its edge against the page isn't so sharp.
    // The shadow is on the outside; the gradient is inside it
    return (
        <View style={styles.green}>
            <Gradient name="brand" style={[styles.band, { paddingTop: insets.top + PADDING_TOP }]}>{logo}</Gradient>
        </View>
    );
}

const make_styles = ({ COLORS, HEADER_SHADOW, BRAND_SHADOW }) => StyleSheet.create({
    // edge to edge, and only as tall as the logo needs
    band: { paddingHorizontal: 18, paddingBottom: PADDING_BOTTOM },
    // frosted with a soft shadow, above the page (zIndex) so the shadow isn't covered by it
    glass: { backgroundColor: COLORS.surface, zIndex: 1, ...HEADER_SHADOW },
    // above the page (zIndex) so the shadow isn't covered by it
    green: { zIndex: 1, ...BRAND_SHADOW },
    logo: { flexDirection: "row", alignItems: "center", minHeight: 40 },
});
