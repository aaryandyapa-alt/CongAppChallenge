import { Platform, Switch } from "react-native";
import { COLORS } from "./theme.js";

/**
 * An on/off switch in the app's colors. Android otherwise draws the knob in the phone's own accent color
 * (often blue): here it's deep green when on, cream when off. iOS keeps its usual white knob.
 *
 * @param {boolean} value
 * @param {Function} on_change - Called with the new value.
 * @param {string} label - What a screen reader says.
 */
export default function ToggleSwitch({ value, on_change, label })
{
    const thumb = Platform.OS === "android" ? (value ? COLORS.accent_text : COLORS.surface) : undefined;

    return (
        <Switch
            value={value}
            onValueChange={on_change}
            trackColor={{ false: COLORS.border, true: COLORS.accent }}
            thumbColor={thumb}
            ios_backgroundColor={COLORS.border}
            accessibilityLabel={label}
        />
    );
}
