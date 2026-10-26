import { LinearGradient } from "expo-linear-gradient";

import { GRADIENT_END, GRADIENT_START } from "./theme.js";
import { useTheme } from "./ThemeContext.js";

/**
 * One of the theme's gradients (see GRADIENTS in theme.js), drawn top-left to bottom-right.
 * Works like a View: give it a style and children, e.g. <Gradient name="button" style={styles.button}>...</Gradient>.
 *
 * @param {string} name - A key of GRADIENTS in theme.js: "button", "brand", "outline", "outline_danger", "error", "starred" or "soft".
 */
export default function Gradient({ name = "button", style, children, ...rest })
{
    const { GRADIENTS } = useTheme();
    return (
        <LinearGradient colors={GRADIENTS[name]} start={GRADIENT_START} end={GRADIENT_END} style={style} {...rest}>
            {children}
        </LinearGradient>
    );
}
