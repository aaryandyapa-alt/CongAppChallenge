import NumberInput from "../components/NumberInput.js";
import StarredField from "../components/StarredField.js";
import TimeInput from "../components/TimeInput.js";
import { field_status } from "../state/DraftRunContext.js";

/**
 * Establishment Basics: opening and closing time, number of stations.
 * Total workers isn't asked; it's added up from the stations and shown on the Summary.
 * Simple asks plain questions; Pro uses short plain labels.
 */
export default function BasicsPage({ draft, errors, edit_field })
{
    const b = draft.form.basics;
    const pro = draft.mode === "pro";
    const status = (path) => field_status(draft, errors, path);

    return (
        <>
            <StarredField label={pro ? "Opening time" : "What time do you open?"} {...status("basics.open_time")}>
                <TimeInput label="Opening time" value={b.open_time} on_change={(v) => edit_field("basics.open_time", v)} has_error={!!errors["basics.open_time"]} />
            </StarredField>

            <StarredField label={pro ? "Closing time" : "What time do you close?"} {...status("basics.close_time")}>
                <TimeInput label="Closing time" default_pm value={b.close_time} on_change={(v) => edit_field("basics.close_time", v)} has_error={!!errors["basics.close_time"]} />
            </StarredField>

            <StarredField label={pro ? "Number of stations" : "How many steps (stations) does each person go through?"} {...status("basics.station_count")}>
                <NumberInput label="Number of stations" whole suffix={pro ? null : "stations"} value={b.station_count} on_change={(v) => edit_field("basics.station_count", v)} has_error={!!errors["basics.station_count"]} />
            </StarredField>
        </>
    );
}
