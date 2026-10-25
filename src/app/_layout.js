import { Stack } from "expo-router";

import { DraftRunProvider } from "../state/DraftRunContext.js";
import { SettingsProvider } from "../state/SettingsContext.js";

// root navigator: the tabs, with every other screen pushed on top of them
// the providers are outside the stack so the settings and the draft run are shared by every screen
export default function RootLayout()
{
    return (
        <SettingsProvider>
            <DraftRunProvider>
                <Stack>
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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
