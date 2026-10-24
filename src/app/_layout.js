import { Stack } from "expo-router";

import { DraftRunProvider } from "../state/DraftRunContext.js";

// root navigator: the tabs, with every other screen pushed on top of them
// DraftRunProvider is outside the stack so the draft run survives moving between screens
export default function RootLayout()
{
    return (
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
    );
}
