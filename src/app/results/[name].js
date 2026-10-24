import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

// placeholder until step 8
export default function ResultsScreen()
{
    const { name } = useLocalSearchParams();
    return (
        <View style={styles.container}>
            <Text>Results: {name}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: "center", justifyContent: "center" },
});
