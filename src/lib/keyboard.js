import { useEffect, useState } from "react";
import { Keyboard, Platform } from "react-native";

/**
 * How tall the on-screen keyboard is right now (0 when it's closed).
 * Used as extra space at the bottom of a scroll view, so everything can be scrolled up above the keyboard
 * while the scroll view itself stays full height (nothing gets cut off at its edge, unlike KeyboardAvoidingView).
 */
export function useKeyboardHeight()
{
    const [height, set_height] = useState(0);

    useEffect(() =>
    {
        // iOS tells us just before the keyboard moves; Android only after
        const show = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
        const hide = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
        const subs = [
            Keyboard.addListener(show, (e) => set_height(e.endCoordinates.height)),
            Keyboard.addListener(hide, () => set_height(0)),
        ];
        return () => subs.forEach((s) => s.remove());
    }, []);

    return height;
}
