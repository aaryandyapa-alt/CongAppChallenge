import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@react-native-vector-icons/ionicons";

/**
 * The small line at the top of each field page on runs the AI filled in, reminding the user to check the values.
 * review.js decides when to show it (only when draft.start_state is "ai-full" or "ai-partial").
 */
export default function AiReminder()
{
    return (
        <View style={styles.row} accessible accessibilityLabel="These values were filled in by AI from your answers. Please check them.">
            <Ionicons name="sparkles-outline" size={16} color="#666" />
            <Text style={styles.text}>Filled in by AI from your answers. Please check them.</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 },
    text: { flexShrink: 1, fontSize: 14, color: "#666", fontStyle: "italic" },
});
