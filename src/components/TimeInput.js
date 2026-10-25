import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

// minutes after midnight -> what the boxes show
function to_parts(value, default_pm)
{
    if (value === null || value === undefined)
        return { hour: "", minute: "", pm: default_pm };
    const h24 = Math.floor(value / 60) % 24;
    const minute = value % 60;
    return { hour: String(h24 % 12 === 0 ? 12 : h24 % 12), minute: String(minute).padStart(2, "0"), pm: h24 >= 12 };
}

/**
 * Minutes after midnight as a clock time for display, like "10:30 AM". Blank or impossible times give "".
 */
export function format_time(value)
{
    if (value === null || value === undefined || Number.isNaN(value))
        return "";
    const parts = to_parts(value, false);
    return `${parts.hour}:${parts.minute} ${parts.pm ? "PM" : "AM"}`;
}

/**
 * A saved run's date_run (an ISO string from run_info.json) for display, like "Oct 25, 2026, 2:30 PM". Missing gives "".
 */
export function format_date_time(iso)
{
    if (!iso)
        return "";
    const d = new Date(iso);
    const date = d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    return `${date}, ${format_time(d.getHours() * 60 + d.getMinutes())}`;
}

// what the boxes show -> minutes after midnight
// null if both boxes are empty; NaN if something is typed but it isn't a real time (form_checks.js tells them apart)
function to_minutes(parts)
{
    if (parts.hour === "" && parts.minute === "")
        return null;
    const hour = Number(parts.hour);
    // a blank minute box means :00
    const minute = parts.minute === "" ? 0 : Number(parts.minute);
    if (parts.hour === "" || hour < 1 || hour > 12 || minute > 59)
        return NaN;
    // 12 AM is midnight and 12 PM is noon
    return ((hour % 12) + (parts.pm ? 12 : 0)) * 60 + minute;
}

/**
 * A clock time typed as hour and minute, with an AM / PM switch.
 * Reports minutes after midnight (10:30 AM is 630), null while it's empty, or NaN if what's typed isn't a real time.
 *
 * @param {number|null} value
 * @param {Function} on_change - Called with the new time, null or NaN.
 * @param {boolean} default_pm - Start on PM while blank (closing times usually are).
 * @param {boolean} has_error - Outlines the boxes in red.
 * @param {string} label - Read out by screen readers, like "Opening time".
 */
export default function TimeInput({ value, on_change, default_pm = false, has_error = false, label })
{
    const [parts, set_parts] = useState(to_parts(value, default_pm));

    // if the value was changed from outside, show it; otherwise keep what's being typed
    // (Object.is, because NaN !== NaN would make this run on every render)
    const [last_value, set_last_value] = useState(value);
    if (!Object.is(value, last_value))
    {
        set_last_value(value);
        if (!Object.is(to_minutes(parts), value ?? null))
            set_parts(to_parts(value, parts.pm));
    }

    function update(changes)
    {
        const next = { ...parts, ...changes };
        set_parts(next);
        on_change(to_minutes(next));
    }

    const digits = (text) => text.replace(/[^0-9]/g, "");

    return (
        <View style={styles.row}>
            <TextInput
                style={[styles.box, has_error && styles.box_error]}
                value={parts.hour}
                onChangeText={(t) => update({ hour: digits(t) })}
                inputMode="numeric"
                maxLength={2}
                placeholder="hh"
                accessibilityLabel={`${label}, hour`}
            />
            <Text style={styles.colon}>:</Text>
            <TextInput
                style={[styles.box, has_error && styles.box_error]}
                value={parts.minute}
                onChangeText={(t) => update({ minute: digits(t) })}
                inputMode="numeric"
                maxLength={2}
                placeholder="mm"
                accessibilityLabel={`${label}, minutes`}
            />
            <View style={styles.switch}>
                {["AM", "PM"].map((period) =>
                {
                    const selected = (period === "PM") === parts.pm;
                    return (
                        <Pressable
                            key={period}
                            onPress={() => update({ pm: period === "PM" })}
                            style={[styles.period, selected && styles.period_selected]}
                            accessibilityRole="button"
                            accessibilityState={{ selected: selected }}
                            accessibilityLabel={`${label}, ${period}`}
                        >
                            <Text style={[styles.period_text, selected && styles.period_text_selected]}>{period}</Text>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: "row", alignItems: "center", gap: 6 },
    box: {
        width: 56, minHeight: 48,
        borderWidth: 2, borderColor: "#c4c4c4", borderRadius: 8,
        fontSize: 18, color: "#1a1a1a", textAlign: "center", backgroundColor: "#fff",
    },
    // only the color changes: changing the border width while typing made some phones re-select the text
    box_error: { borderColor: "#b3261e" },
    colon: { fontSize: 20, color: "#1a1a1a" },
    switch: { flexDirection: "row", marginLeft: 8, borderWidth: 1, borderColor: "#c4c4c4", borderRadius: 8, overflow: "hidden" },
    period: { minHeight: 48, paddingHorizontal: 12, justifyContent: "center", backgroundColor: "#fff" },
    period_selected: { backgroundColor: "#1d5fd1" },
    period_text: { fontSize: 16, color: "#1a1a1a" },
    period_text_selected: { color: "#fff", fontWeight: "600" },
});
