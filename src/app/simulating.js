import { StyleSheet, Text, View } from "react-native";

// placeholder until step 7
export default function SimulatingScreen()
{
    return (
        <View style={styles.container}>
            <Text>Simulating</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: "center", justifyContent: "center" },
});
