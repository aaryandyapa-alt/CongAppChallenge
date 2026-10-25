import { Stack } from "expo-router";

import { DraftRunProvider } from "../state/DraftRunContext.js";
import { SettingsProvider } from "../state/SettingsContext.js";
import { COLORS } from "../components/theme.js";

// root navigator: the tabs, with every other screen pushed on top of them
// the providers are outside the stack so the settings and the draft run are shared by every screen
export default function RootLayout()
{
    return (
        <SettingsProvider>
            <DraftRunProvider>
                <Stack
                    screenOptions={{
                        // iOS 26 makes headers see-through and floating by default, so screens drew underneath them
                        // (the review's progress bar ended up behind the status bar). A solid header puts every screen
                        // below it, the same as on Android.
                        headerTransparent: false,
                        headerStyle: { backgroundColor: COLORS.surface },
                        headerTintColor: COLORS.accent,
                        // only the back arrow, no previous screen's title next to it (on iOS that squeezed the title)
                        headerBackButtonDisplayMode: "minimal",
                    }}
                >
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="tutorial" options={{ headerShown: false }} />
                    <Stack.Screen name="new-run" options={{ title: "New run" }} />
                    <Stack.Screen name="questions" options={{ title: "Questions" }} />
                    <Stack.Screen name="generating" options={{ title: "Generating values" }} />
                    <Stack.Screen name="intro" options={{ title: "Before you start" }} />
                    <Stack.Screen name="review" options={{ title: "Review" }} />
                    <Stack.Screen name="simulating" options={{ title: "Simulating" }} />
                    <Stack.Screen name="runs/[name]" options={{ title: "Saved run" }} />
                    <Stack.Screen name="results/[name]" options={{ title: "Results" }} />
                </Stack>
            </DraftRunProvider>
        </SettingsProvider>
    );
}
