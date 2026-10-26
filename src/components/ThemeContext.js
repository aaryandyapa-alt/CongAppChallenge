import { createContext, useContext, useMemo } from "react";
import { useColorScheme } from "react-native";

import { useSettings } from "../state/SettingsContext.js";
import { DARK, LIGHT } from "./theme.js";

const ThemeContext = createContext(LIGHT);

/**
 * Picks the light or dark theme (theme.js) from the Appearance setting: "light" (the default), "dark", or "system"
 * (follow the phone).
 * Wraps the app inside SettingsProvider in src/app/_layout.js.
 */
export function ThemeProvider({ children })
{
    const { settings } = useSettings();
    const phone = useColorScheme();
    const appearance = settings["appearance"];
    const dark = appearance === "dark" || (appearance === "system" && phone === "dark");

    return <ThemeContext value={dark ? DARK : LIGHT}>{children}</ThemeContext>;
}

/**
 * The current theme: const { COLORS, CARD_SHADOW } = useTheme(); (every name is listed at make_theme in theme.js).
 */
export function useTheme()
{
    return useContext(ThemeContext);
}

// each file's styles, built once per theme and then shared by every copy of that component
const built = new WeakMap();

/**
 * A file's styles for the current theme. Each file writes its styles as a function of the theme:
 *   const make_styles = ({ COLORS, CARD_SHADOW }) => StyleSheet.create({ ... });
 * and its components call: const styles = useThemedStyles(make_styles);
 */
export function useThemedStyles(make_styles)
{
    const theme = useTheme();
    return useMemo(() =>
    {
        let per_theme = built.get(make_styles);
        if (!per_theme)
        {
            per_theme = {};
            built.set(make_styles, per_theme);
        }
        per_theme[theme.name] ??= make_styles(theme);
        return per_theme[theme.name];
    }, [make_styles, theme]);
}
