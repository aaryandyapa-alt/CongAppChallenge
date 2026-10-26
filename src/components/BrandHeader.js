import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import Gradient from "./Gradient.js";
import { FONTS, HEADER_STYLE } from "./theme.js";
import { useTheme, useThemedStyles } from "./ThemeContext.js";

const LOGO_ROW = 40;
const PADDING_TOP = 6;
const PADDING_BOTTOM = 10;

/**
 * The top of the tabs (Home and Settings), with the logo in its top-left corner. Two looks, picked by HEADER_STYLE
 * in theme.js: "green" (a lime band with a soft shadow under it) or "glass" (a frosted white bar over the page's glow).
 * Until the real logo is added, a leaf and the name stand in for it: swap the contents of styles.logo for an <Image>.
 */
export default function BrandHeader()
{
    const { COLORS } = useTheme();
    const styles = useThemedStyles(make_styles);
    const insets = useSafeAreaInsets();
    const glass = HEADER_STYLE === "glass";

    const logo = (
        <View style={styles.logo} accessible accessibilityRole="header" accessibilityLabel="ShiftLime">
            {/* on glass, the leaf sits in a small lime circle */}
            {glass ? (
                <Gradient name="button" style={styles.leaf_circle}>
                    <Ionicons name="leaf" size={18} color={COLORS.on_accent} />
                </Gradient>
            ) : (
                <Ionicons name="leaf" size={24} color={COLORS.on_accent} />
            )}
            {/* on the green band the name stays dark ink in both themes; on glass it follows the theme */}
            <Text style={[styles.name, !glass && styles.name_on_green]}>ShiftLime</Text>
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
    band: { paddingHorizontal: 20, paddingBottom: PADDING_BOTTOM },
    // frosted white with a soft shadow, above the page (zIndex) so the shadow isn't covered by it
    glass: { backgroundColor: COLORS.surface, zIndex: 1, ...HEADER_SHADOW },
    // above the page (zIndex) so the shadow isn't covered by it
    green: { zIndex: 1, ...BRAND_SHADOW },
    logo: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: LOGO_ROW },
    leaf_circle: { width: 32, height: 32, borderRadius: 16, overflow: "hidden", alignItems: "center", justifyContent: "center" },
    name: { fontSize: 23, fontFamily: FONTS.extrabold, color: COLORS.text, letterSpacing: -0.6 },
    name_on_green: { color: COLORS.on_accent },
});
