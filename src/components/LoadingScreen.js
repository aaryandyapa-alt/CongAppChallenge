import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { COLORS } from "./theme.js";

/**
 * A spinner with a message, for "Generating values" and "Simulating".
 * The spinner is drawn by the phone itself, so it keeps moving even while the app's JavaScript is busy simulating.
 *
 * @param {string} message - The main line, like "Simulating".
 * @param {string} detail - A smaller line underneath (optional).
 */
export default function LoadingScreen({ message, detail })
{
    return (
        <View style={styles.screen} accessibilityLiveRegion="polite">
            <ActivityIndicator size="large" color={COLORS.accent} />
            <Text style={styles.message}>{message}</Text>
            {detail ? <Text style={styles.detail}>{detail}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 16, backgroundColor: COLORS.background },
    message: { fontSize: 22, fontWeight: "600", color: COLORS.text, textAlign: "center" },
    detail: { fontSize: 16, lineHeight: 22, color: COLORS.text_muted, textAlign: "center" },
});
