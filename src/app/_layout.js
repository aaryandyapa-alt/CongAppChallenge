// each weight on its own, so only these six font files go into the app (not all fourteen)
import { PlusJakartaSans_400Regular } from "@expo-google-fonts/plus-jakarta-sans/400Regular";
import { PlusJakartaSans_400Regular_Italic } from "@expo-google-fonts/plus-jakarta-sans/400Regular_Italic";
import { PlusJakartaSans_500Medium } from "@expo-google-fonts/plus-jakarta-sans/500Medium";
import { PlusJakartaSans_600SemiBold } from "@expo-google-fonts/plus-jakarta-sans/600SemiBold";
import { PlusJakartaSans_700Bold } from "@expo-google-fonts/plus-jakarta-sans/700Bold";
import { PlusJakartaSans_800ExtraBold } from "@expo-google-fonts/plus-jakarta-sans/800ExtraBold";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

import { DraftRunProvider } from "../state/DraftRunContext.js";
import { SettingsProvider } from "../state/SettingsContext.js";
import { COLORS } from "../components/theme.js";

// keep the splash screen up until the fonts are in, so text never flashes in the phone's own font first
SplashScreen.preventAutoHideAsync();

// root navigator: the tabs, with every other screen pushed on top of them
// the providers are outside the stack so the settings and the draft run are shared by every screen
export default function RootLayout()
{
    // the names here are the fontFamily values in FONTS (theme.js)
    const [loaded, error] = useFonts({
        PlusJakartaSans_400Regular,
        PlusJakartaSans_400Regular_Italic,
        PlusJakartaSans_500Medium,
        PlusJakartaSans_600SemiBold,
        PlusJakartaSans_700Bold,
        PlusJakartaSans_800ExtraBold,
    });

    useEffect(() =>
    {
        // if the fonts fail to load, carry on in the phone's font rather than staying on the splash screen
        if (loaded || error)
            SplashScreen.hideAsync();
    }, [loaded, error]);

    if (!loaded && !error)
        return null;

    return (
        <SettingsProvider>
            <DraftRunProvider>
                {/* no header bars: each screen draws its own top (TopBar, BrandHeader, or Review's top),
                    and the loading screens have none */}
                <Stack
                    screenOptions={{
                        headerShown: false,
                        // cream behind any screen that doesn't set its own background
                        contentStyle: { backgroundColor: COLORS.background },
                    }}
                />
            </DraftRunProvider>
        </SettingsProvider>
    );
}
