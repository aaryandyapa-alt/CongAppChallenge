import { Stack } from "expo-router";

// root navigator: the tabs, with every other screen pushed on top of them
// DraftRunProvider gets wrapped around this in step 3
export default function RootLayout()
{
    return (
        <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="new-run" options={{ title: "New run" }} />
            <Stack.Screen name="questions" options={{ title: "Questions" }} />
            <Stack.Screen name="generating" options={{ title: "Generating values" }} />
            <Stack.Screen name="review" options={{ title: "Review" }} />
            <Stack.Screen name="simulating" options={{ title: "Simulating" }} />
            <Stack.Screen name="runs/[name]" options={{ title: "Saved run" }} />
            <Stack.Screen name="results/[name]" options={{ title: "Results" }} />
        </Stack>
    );
}
