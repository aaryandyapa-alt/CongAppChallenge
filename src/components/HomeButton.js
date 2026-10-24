import { router } from "expo-router";
import { Alert, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@react-native-vector-icons/ionicons";

/**
 * A home icon for the header while a run is being set up. It asks first, since the run isn't saved
 * until the simulation finishes, so leaving loses it.
 *
 * @param {Function} disable_prevention - From usePreventRemove, on screens that block going back
 *     (review.js); without it, leaving would be caught and just go back a page.
 */
export default function HomeButton({ disable_prevention })
{
    function leave()
    {
        disable_prevention?.();
        // the draft isn't cleared here: the closing screens would each redirect Home as it emptied.
        // It's never saved, and the next New run or Duplicate replaces it.
        router.dismissTo("/");
    }

    function ask()
    {
        Alert.alert(
            "Go back to Home?",
            "Are you sure? Your progress on this run will be lost.",
            [
                { text: "Keep editing", style: "cancel" },
                { text: "Leave", style: "destructive", onPress: leave },
            ],
        );
    }

    return (
        <Pressable onPress={ask} hitSlop={10} style={styles.button} accessibilityRole="button" accessibilityLabel="Home" accessibilityHint="Leaves this run without saving">
            <Ionicons name="home-outline" size={24} color="#1d5fd1" />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: { paddingHorizontal: 4 },
});
