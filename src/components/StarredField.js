import { StyleSheet, Text, View } from "react-native";

/**
 * Wraps one input with its label, a star, and its error message.
 * It only shows the star; when a star appears or clears is decided in state/DraftRunContext.js.
 *
 * @param {string} label - The question shown above the input.
 * @param {boolean} starred - The AI couldn't fill this field, so it holds a default value.
 * @param {string|null} error - A message from check_form, or null.
 * @param {*} children - The input itself.
 */
export default function StarredField({ label, starred = false, error = null, children })
{
    return (
        <View style={styles.field}>
            <View style={styles.label_row}>
                <Text style={styles.label}>{label}</Text>
                {starred ? (
                    <Text
                        style={styles.star}
                        accessibilityLabel="The AI couldn't fill this, so a default value was used. Please check it."
                    >
                        ★
                    </Text>
                ) : null}
            </View>
            {children}
            {error ? <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    field: { gap: 8, marginBottom: 20 },
    label_row: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
    label: { fontSize: 17, color: "#1a1a1a", flexShrink: 1 },
    star: { fontSize: 18, color: "#c77700" },
    error: { fontSize: 15, color: "#b3261e" },
});
