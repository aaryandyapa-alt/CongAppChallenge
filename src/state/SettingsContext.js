import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { load_settings, save_settings } from "../storage.js";

/**
 * The app's settings, loaded once from settings.json (see storage.js) and shared with every screen.
 * A setting that was never changed uses its default below.
 */
export const DEFAULT_SETTINGS = {
    // round arrow buttons on the results pages; small-phone users can turn them off for more room
    "results_arrows": true,
    // keep the Next / Submit bar above the keyboard; off leaves it behind the keyboard so the page has more room
    "bar_above_keyboard": true,
    // Developer: show how long each simulation took, at the bottom of its results
    "show_timings": false,
    // the welcome tutorial has been finished or skipped, so it isn't shown on launch again (Settings can replay it)
    "seen_tutorial": false,
};

const SettingsContext = createContext(null);

// wraps the whole app in src/app/_layout.js
export function SettingsProvider({ children })
{
    // null until settings.json has been read
    const [saved, set_saved] = useState(null);

    useEffect(() =>
    {
        load_settings().then(set_saved);
    }, []);

    const value = useMemo(() => ({
        settings: { ...DEFAULT_SETTINGS, ...saved },
        // false until the saved settings are in; decisions like showing the tutorial on launch wait for this
        loaded: saved !== null,
        // changes one setting and saves the file
        change_setting: (key, setting_value) =>
        {
            const next = { ...saved, [key]: setting_value };
            set_saved(next);
            save_settings(next);
        },
    }), [saved]);

    return <SettingsContext value={value}>{children}</SettingsContext>;
}

/**
 * For screens: const { settings, loaded, change_setting } = useSettings();
 */
export function useSettings()
{
    const value = useContext(SettingsContext);
    if (value === null)
        throw new Error("useSettings must be used inside SettingsProvider");
    return value;
}
