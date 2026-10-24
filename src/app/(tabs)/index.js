import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

// placeholder until step 9; the links are temporary, so every screen can be opened while building
export default function HomeScreen()
{
    return (
        <View style={styles.container}>
            <Text>Home</Text>
            <Link href="/new-run">New run</Link>
            <Link href="/questions">Questions</Link>
            <Link href="/generating">Generating values</Link>
            <Link href="/review">Review</Link>
            <Link href="/simulating">Simulating</Link>
            <Link href="/runs/test-1">Saved run: test-1</Link>
            <Link href="/results/test-1">Results: test-1</Link>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
});
