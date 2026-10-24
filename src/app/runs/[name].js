import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

// placeholder until step 9
export default function SavedRunScreen()
{
    const { name } = useLocalSearchParams();
    return (
        <View style={styles.container}>
            <Text>Saved run: {name}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: "center", justifyContent: "center" },
});
