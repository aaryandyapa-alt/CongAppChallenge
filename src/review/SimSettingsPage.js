import NumberInput from "../components/NumberInput.js";
import StarredField from "../components/StarredField.js";
import { field_status } from "../state/DraftRunContext.js";

/**
 * Pro only: simulation_settings. Simple mode always uses the defaults in lib/form_to_schema.js.
 */
export default function SimSettingsPage({ draft, errors, edit_field })
{
    const sim = draft.form.sim;
    const status = (path) => field_status(draft, errors, path);

    return (
        <>
            <StarredField label="Replications (simulated days)" {...status("sim.replications")}>
                <NumberInput label="Replications" whole value={sim.replications} on_change={(v) => edit_field("sim.replications", v)} has_error={!!errors["sim.replications"]} />
            </StarredField>
            <StarredField label="Random seed" {...status("sim.seed")}>
                <NumberInput label="Random seed" whole value={sim.seed} on_change={(v) => edit_field("sim.seed", v)} has_error={!!errors["sim.seed"]} />
            </StarredField>
        </>
    );
}
