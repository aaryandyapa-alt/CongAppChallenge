import { TextInput, StyleSheet } from "react-native";

import LevelPicker, { VARIANCE_OPTIONS } from "../components/LevelPicker.js";
import NumberInput from "../components/NumberInput.js";
import StarredField, { STARRED_BOX } from "../components/StarredField.js";
import { field_status } from "../state/DraftRunContext.js";
import { COLORS } from "../components/theme.js";

export const STATION_TYPE_OPTIONS = [
    { value: "staffed", label: "Staffed: workers help each person" },
    { value: "customer_led", label: "Customer-led: people do it themselves" },
];
const PRO_STATION_TYPE_OPTIONS = [
    { value: "staffed", label: "Staffed" },
    { value: "customer_led", label: "Customer-led" },
];
export const DISTRIBUTION_OPTIONS = [
    { value: "lognormal", label: "Lognormal" },
    { value: "exponential", label: "Exponential" },
];

/**
 * One station, in visiting order. index is its position (0 is the first station).
 * Workers only show for staffed stations; customer-led stations are stored as workers: 0.
 */
export default function StationPage({ draft, errors, edit_field, index })
{
    const s = draft.form.stations[index];
    const pro = draft.mode === "pro";
    const p = `stations.${index}.`;
    const status = (name) => field_status(draft, errors, p + name);
    const edit = (name, v) => edit_field(p + name, v);

    return (
        <>
            <StarredField label="Station name" {...status("name")}>
                <TextInput
                    style={[styles.name_box, status("name").starred && STARRED_BOX, errors[p + "name"] && styles.name_box_error]}
                    value={s.name}
                    onChangeText={(v) => edit("name", v)}
                    placeholder="For example: Intake"
                    maxLength={40}
                    accessibilityLabel="Station name"
                />
            </StarredField>

            <StarredField label={pro ? "Station type" : "Who does the work at this station?"} {...status("customer_led")}>
                <LevelPicker
                    label="Station type"
                    options={pro ? PRO_STATION_TYPE_OPTIONS : STATION_TYPE_OPTIONS}
                    value={s.customer_led ? "customer_led" : "staffed"}
                    on_change={(v) => edit("customer_led", v === "customer_led")}
                />
            </StarredField>

            {s.customer_led ? null : (
                <StarredField label={pro ? "Workers" : "How many people work here?"} {...status("workers")}>
                    <NumberInput label="Workers at this station" whole suffix={pro ? null : "workers"} value={s.workers} on_change={(v) => edit("workers", v)} has_error={!!errors[p + "workers"]} />
                </StarredField>
            )}

            <StarredField label={pro ? "Mean time at station" : "On average, how long does each person spend here?"} {...status("minutes")}>
                <NumberInput label="Average minutes" suffix="mins" value={s.minutes} on_change={(v) => edit("minutes", v)} has_error={!!errors[p + "minutes"]} />
            </StarredField>

            {pro ? (
                <>
                    <StarredField label="Time distribution" {...status("distribution")}>
                        <LevelPicker label="Distribution" options={DISTRIBUTION_OPTIONS} value={s.distribution} on_change={(v) => edit("distribution", v)} has_error={!!errors[p + "distribution"]} />
                    </StarredField>
                    {/* exponential's spread is fixed, so it has no stddev */}
                    {s.distribution === "lognormal" ? (
                        <StarredField label="Standard deviation" {...status("stddev")}>
                            <NumberInput label="Standard deviation" suffix="mins" value={s.stddev} on_change={(v) => edit("stddev", v)} has_error={!!errors[p + "stddev"]} />
                        </StarredField>
                    ) : null}
                </>
            ) : (
                <StarredField label="Does that time vary much from person to person?" {...status("variance_level")}>
                    <LevelPicker label="How much the time varies" options={VARIANCE_OPTIONS} value={s.variance_level} on_change={(v) => edit("variance_level", v)} has_error={!!errors[p + "variance_level"]} />
                </StarredField>
            )}
        </>
    );
}

const styles = StyleSheet.create({
    name_box: {
        minHeight: 48, paddingHorizontal: 12,
        borderWidth: 2, borderColor: COLORS.border, borderRadius: 8,
        fontSize: 18, color: COLORS.text, backgroundColor: COLORS.surface,
    },
    // same width as normal so the box doesn't change while typing (see NumberInput)
    name_box_error: { borderColor: COLORS.error },
});
