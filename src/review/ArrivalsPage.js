import LevelPicker, { BURST_OPTIONS } from "../components/LevelPicker.js";
import NumberInput from "../components/NumberInput.js";
import StarredField from "../components/StarredField.js";
import TimeInput from "../components/TimeInput.js";
import { field_status } from "../state/DraftRunContext.js";

const TYPE_OPTIONS = [
    { value: "consistent", label: "Consistent: about the same all day" },
    { value: "bursty", label: "Bursts: busier at a certain time" },
];
const PRO_TYPE_OPTIONS = [
    { value: "consistent", label: "Consistent" },
    { value: "bursty", label: "Bursty" },
];

/**
 * Arrivals: how people arrive and how many per hour.
 * The busiest time and how much busier it is only show for bursts.
 */
export default function ArrivalsPage({ draft, errors, edit_field })
{
    const a = draft.form.arrivals;
    const pro = draft.mode === "pro";
    const status = (path) => field_status(draft, errors, path);

    return (
        <>
            <StarredField label={pro ? "Arrival pattern" : "How do people arrive?"} {...status("arrivals.type")}>
                <LevelPicker label="How people arrive" options={pro ? PRO_TYPE_OPTIONS : TYPE_OPTIONS} value={a.type} on_change={(v) => edit_field("arrivals.type", v)} has_error={!!errors["arrivals.type"]} />
            </StarredField>

            <StarredField label={pro ? "Average arrivals per hour" : "About how many people come in per hour?"} {...status("arrivals.per_hour")}>
                <NumberInput label="People per hour" suffix={pro ? null : "per hour"} value={a.per_hour} on_change={(v) => edit_field("arrivals.per_hour", v)} has_error={!!errors["arrivals.per_hour"]} />
            </StarredField>

            {a.type === "bursty" ? (
                <>
                    <StarredField label={pro ? "Peak time" : "What's the busiest time of day?"} {...status("arrivals.peak_time")}>
                        <TimeInput label="Busiest time" value={a.peak_time} on_change={(v) => edit_field("arrivals.peak_time", v)} has_error={!!errors["arrivals.peak_time"]} />
                    </StarredField>

                    {pro ? (
                        <StarredField label="Burst fraction (0 to 1)" {...status("arrivals.burst_frac")}>
                            <NumberInput label="Burst fraction" value={a.burst_frac} on_change={(v) => edit_field("arrivals.burst_frac", v)} has_error={!!errors["arrivals.burst_frac"]} />
                        </StarredField>
                    ) : (
                        <StarredField label="How much busier is the busiest time?" {...status("arrivals.burst_level")}>
                            <LevelPicker label="How much busier" options={BURST_OPTIONS} value={a.burst_level} on_change={(v) => edit_field("arrivals.burst_level", v)} has_error={!!errors["arrivals.burst_level"]} />
                        </StarredField>
                    )}
                </>
            ) : null}
        </>
    );
}
