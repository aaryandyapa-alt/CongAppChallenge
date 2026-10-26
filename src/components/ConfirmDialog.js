import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@react-native-vector-icons/ionicons";

import Gradient from "./Gradient.js";
import OutlineButton from "./OutlineButton.js";
import PrimaryButton from "./PrimaryButton.js";
import { FONTS, RADIUS } from "./theme.js";
import { useTheme, useThemedStyles } from "./ThemeContext.js";

/**
 * A themed "are you sure?" box, in place of the phone's plain system alert.
 * The safe choice (cancel) is the big lime button; the risky one is the red OutlineButton under it.
 * Tapping outside the box, or the phone's back button, cancels.
 * Without a confirm_label it's just a message with one button (cancel_label, like "OK").
 *
 * @param {boolean} visible
 * @param {string} icon - An Ionicons name shown in a circle at the top.
 * @param {string} title
 * @param {string} message
 * @param {string} cancel_label - Like "Keep editing".
 * @param {string} confirm_label - Like "Leave" (optional).
 * @param {boolean} danger - The confirm deletes something: the icon's circle is red instead of lime.
 * @param {Function} on_cancel
 * @param {Function} on_confirm
 */
export default function ConfirmDialog({ visible, icon, title, message, cancel_label, confirm_label, danger, on_cancel, on_confirm })
{
    const { COLORS } = useTheme();
    const styles = useThemedStyles(make_styles);
    const icon_content = <Ionicons name={icon} size={30} color={danger ? COLORS.error : COLORS.accent_text} />;

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={on_cancel} statusBarTranslucent navigationBarTranslucent>
            <View style={styles.screen}>
                {/* the dimmed page behind; tapping it cancels */}
                <Pressable style={StyleSheet.absoluteFill} onPress={on_cancel} accessibilityLabel={cancel_label} accessibilityRole="button" />

                <View style={styles.box} accessibilityViewIsModal>
                    {danger
                        ? <View style={[styles.icon_circle, styles.icon_danger]}>{icon_content}</View>
                        : <Gradient name="soft" style={styles.icon_circle}>{icon_content}</Gradient>}
                    <Text style={styles.title} accessibilityRole="header">{title}</Text>
                    <Text style={styles.message}>{message}</Text>

                    <View style={styles.buttons}>
                        <PrimaryButton label={cancel_label} on_press={on_cancel} />
                        {confirm_label ? <OutlineButton label={confirm_label} on_press={on_confirm} danger on_card /> : null}
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const make_styles = ({ COLORS, PANEL_SHADOW }) => StyleSheet.create({
    screen: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28, backgroundColor: COLORS.backdrop },
    // solid white (nothing should show through over the dimmed page), with big round corners
    box: {
        width: "100%", maxWidth: 380, alignItems: "center", gap: 10,
        paddingHorizontal: 24, paddingTop: 30, paddingBottom: 22,
        borderRadius: RADIUS.panel, backgroundColor: COLORS.surface_solid, ...PANEL_SHADOW,
    },
    // overflow hidden so the gradient is clipped to the circle
    icon_circle: { width: 64, height: 64, borderRadius: 32, overflow: "hidden", alignItems: "center", justifyContent: "center", marginBottom: 4 },
    icon_danger: { backgroundColor: COLORS.error_light },
    title: { fontSize: 22, fontFamily: FONTS.extrabold, color: COLORS.text, textAlign: "center", letterSpacing: -0.4 },
    message: { fontFamily: FONTS.regular, fontSize: 16, lineHeight: 23, color: COLORS.text_secondary, textAlign: "center" },
    buttons: { alignSelf: "stretch", gap: 10, marginTop: 14 },
});
