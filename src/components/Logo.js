import { Image } from "react-native";
import { useTheme } from "./ThemeContext.js";

// the horizontal logo (clock mark + "ShiftLime"), 1024 x 300; 1024 wide is sharp up to about 300 points wide on 3x screens
const LOGOS = {
    color: require("../../assets/logo-color.png"),
    color_on_dark: require("../../assets/logo-color-on-dark.png"),
    // one color, deep forest green: sits better on the lime band than pure black
    mono: require("../../assets/logo-mono-green.png"),
};
const LOGO_RATIO = 1024 / 300;

// the clock mark on its own (square, 512 x 512)
const MARK = require("../../assets/mark.png");

/**
 * The ShiftLime logo. By default it follows the theme (the full-color logo, or its on-dark version in dark mode);
 * "mono" is the one-color deep green version, for the lime band, where the full-color logo's lime "Lime" would disappear.
 * Screen readers read it as "ShiftLime".
 *
 * @param {number} height - In points; the width follows the logo's shape.
 * @param {string} variant - "auto" (default) or "mono".
 */
export default function Logo({ height, variant = "auto", style })
{
    const { dark } = useTheme();
    const source = variant === "mono" ? LOGOS.mono : dark ? LOGOS.color_on_dark : LOGOS.color;
    return (
        <Image
            source={source}
            style={[{ height: height, width: height * LOGO_RATIO }, style]}
            resizeMode="contain"
            accessible
            accessibilityRole="image"
            accessibilityLabel="ShiftLime"
        />
    );
}

/**
 * The clock mark on its own, in full color (it reads on both light and dark backgrounds).
 *
 * @param {number} size - Width and height in points.
 */
export function Mark({ size, style })
{
    return <Image source={MARK} style={[{ width: size, height: size }, style]} resizeMode="contain" />;
}
