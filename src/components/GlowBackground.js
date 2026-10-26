import { StyleSheet, View } from "react-native";
import { useTheme } from "./ThemeContext.js";

/**
 * The soft lime and mint glows behind a screen (GLOWS in theme.js), drawn by React Native itself as radial gradients.
 * Put it first inside a screen's root view (which has the cream page color), so everything else sits on top.
 */
export default function GlowBackground()
{
    const { GLOWS } = useTheme();
    return (
        <View style={[StyleSheet.absoluteFill, { pointerEvents: "none" }]}>
            {GLOWS.map((glow) => <View key={glow} style={[StyleSheet.absoluteFill, { backgroundImage: glow }]} />)}
        </View>
    );
}
