import { router } from "expo-router";
import { useState } from "react";
import ConfirmDialog from "./ConfirmDialog.js";
import RoundButton from "./RoundButton.js";

/**
 * A round home button for the top corner while a run is being set up. It asks first, since the run isn't saved
 * until the simulation finishes, so leaving loses it.
 *
 * @param {Function} disable_prevention - From usePreventRemove, on screens that block going back
 *     (review.js); without it, leaving would be caught and just go back a page.
 * @param {boolean} ask - Ask before leaving. Off where nothing would be lost (the results after a run, which is already saved).
 */
export default function HomeButton({ disable_prevention, ask: should_ask = true })
{
    const [asking, set_asking] = useState(false);

    function leave()
    {
        set_asking(false);
        disable_prevention?.();
        // the draft isn't cleared here: the closing screens would each redirect Home as it emptied.
        // It's never saved, and the next New run or Duplicate replaces it.
        router.dismissTo("/");
    }

    return (
        <>
            <RoundButton
                icon="home-outline"
                on_press={should_ask ? () => set_asking(true) : leave}
                label="Home"
                hint={should_ask ? "Leaves this run without saving" : undefined}
            />
            {should_ask ? (
                <ConfirmDialog
                    visible={asking}
                    icon="home-outline"
                    title="Go back to Home?"
                    message="Your progress on this run will be lost."
                    cancel_label="Keep editing"
                    confirm_label="Leave"
                    on_cancel={() => set_asking(false)}
                    on_confirm={leave}
                />
            ) : null}
        </>
    );
}
