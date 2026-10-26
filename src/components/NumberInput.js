import { useContext, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { STARRED_BOX, StarredContext } from "./StarredField.js";
import { COLORS, FONTS, RADIUS } from "./theme.js";

// "" and "." mean the field is blank
function parse(text)
{
    if (text === "" || text === ".")
        return null;
    return Number(text);
}

const to_text = (value) => value === null || value === undefined ? "" : String(value);

/**
 * A typed number field. Reports a number, or null while it's blank.
 *
 * @param {number|null} value
 * @param {Function} on_change - Called with the new number, or null.
 * @param {boolean} whole - Only allow whole numbers (workers, station counts).
 * @param {string} suffix - Shown after the box, like "mins" or "per hour".
 * @param {boolean} has_error - Outlines the box in red.
 * @param {string} label - Read out by screen readers.
 */
export default function NumberInput({ value, on_change, whole = false, suffix, has_error = false, label })
{
    // the typed text is kept separately so in-between text like "2." isn't lost
    const [text, set_text] = useState(to_text(value));
    // amber box when the AI couldn't fill this field (red wins if there's also a problem)
    const starred = useContext(StarredContext);

    // if the value was changed from outside (like a duplicated run loading), show it;
    // changes that came from typing already match the text, so it's left alone
    const [last_value, set_last_value] = useState(value);
    if (value !== last_value)
    {
        set_last_value(value);
        if (parse(text) !== (value ?? null))
            set_text(to_text(value));
    }

    function handle_change(new_text)
    {
        // keep digits, plus one dot for decimals
        let cleaned = new_text.replace(whole ? /[^0-9]/g : /[^0-9.]/g, "");
        const dot = cleaned.indexOf(".");
        if (dot !== -1)
            cleaned = cleaned.slice(0, dot + 1) + cleaned.slice(dot + 1).replaceAll(".", "");
        set_text(cleaned);
        on_change(parse(cleaned));
    }

    return (
        <View style={styles.row}>
            <TextInput
                style={[styles.box, starred && STARRED_BOX, has_error && styles.box_error]}
                value={text}
                onChangeText={handle_change}
                inputMode={whole ? "numeric" : "decimal"}
                maxLength={7}
                accessibilityLabel={label}
            />
            {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: "row", alignItems: "center", gap: 8 },
    box: {
        minWidth: 76, minHeight: 50, paddingHorizontal: 12,
        borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.input,
        fontFamily: FONTS.regular, fontSize: 18, color: COLORS.text, textAlign: "center", backgroundColor: COLORS.surface,
    },
    // only the color changes: changing the border width while typing made some phones re-select the text
    box_error: { borderColor: COLORS.error },
    suffix: { fontFamily: FONTS.regular, fontSize: 16, color: COLORS.text_muted },
});
