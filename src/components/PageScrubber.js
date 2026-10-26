import * as Haptics from "expo-haptics";
import { useLayoutEffect, useMemo, useRef } from "react";
import { PanResponder, Platform, StyleSheet, View } from "react-native";

import { RADIUS } from "./theme.js";
import { useThemedStyles } from "./ThemeContext.js";

// how far a finger moves sideways for each page
const STEP = 36;
// how far it has to move sideways (and more sideways than up or down) before a drag takes over from a tap
const START = 12;

// a light tick each time the page changes, like scrolling the iPhone home screen's dots
function tick()
{
    const done = Platform.OS === "android"
        ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Segment_Tick)
        : Haptics.selectionAsync();
    done.catch(() => {});
}

/**
 * A row of page dots (the current one long and lime) above its children, like the iPhone home screen's dots:
 * dragging sideways anywhere on it moves through the pages, one page per STEP points (right for later pages, left
 * for earlier ones), with a tick on each change. Used for the results' page counter. Taps on any children still work
 * as usual; a drag only takes over once the finger has clearly moved sideways. Screen readers can change the page
 * by adjusting the dots.
 *
 * @param {number} count - How many pages.
 * @param {number} current - The page being shown.
 * @param {Function} on_change - Called with the page to show.
 */
export default function PageScrubber({ count, current, on_change, children })
{
    const styles = useThemedStyles(make_styles);

    // the gesture handlers are made once, so they read the latest values from here
    const latest = useRef({ count, current, on_change });
    useLayoutEffect(() =>
    {
        latest.current = { count, current, on_change };
    });
    // the page the drag started on, and the page it's showing now
    const drag = useRef({ start: 0, shown: 0 });

    // Made once on purpose: a PanResponder keeps the drag's progress inside itself, so rebuilding it when the page
    // changes mid-drag would reset the drag. The refs are only read inside the handlers (while dragging), never
    // while drawing, which is what the lint rule is guarding against.
    // eslint-disable-next-line react-hooks/refs
    const pan = useMemo(() => PanResponder.create({
        // the capture version, so the drag can take over from a Next button the finger started on
        onMoveShouldSetPanResponderCapture: (e, g) => Math.abs(g.dx) > START && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
        onPanResponderGrant: () =>
        {
            drag.current = { start: latest.current.current, shown: latest.current.current };
        },
        onPanResponderMove: (e, g) =>
        {
            const { count: n, on_change: change } = latest.current;
            const target = Math.max(0, Math.min(n - 1, drag.current.start + Math.round(g.dx / STEP)));
            if (target !== drag.current.shown)
            {
                drag.current.shown = target;
                change(target);
                tick();
            }
        },
        // once dragging, keep it (don't let the page's scroll view take the gesture)
        onPanResponderTerminationRequest: () => false,
    }), []);

    function adjust(event)
    {
        const target = event.nativeEvent.actionName === "increment" ? current + 1 : current - 1;
        if (target >= 0 && target < count)
            on_change(target);
    }

    return (
        <View style={styles.area} {...pan.panHandlers}>
            <View
                style={styles.dots}
                accessible
                accessibilityRole="adjustable"
                accessibilityLabel="Page"
                accessibilityValue={{ text: `${current + 1} of ${count}` }}
                accessibilityHint="Drag along the bar to move between pages"
                accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
                onAccessibilityAction={adjust}
            >
                {Array.from({ length: count }, (_, i) => <View key={i} style={[styles.dot, i === current && styles.dot_current]} />)}
            </View>
            {children}
        </View>
    );
}

const make_styles = ({ COLORS }) => StyleSheet.create({
    area: { gap: 10 },
    // a little padding above and below so the dots are easy to grab
    dots: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 5, paddingVertical: 4, flexWrap: "wrap" },
    dot: { width: 7, height: 7, borderRadius: RADIUS.pill, backgroundColor: COLORS.track },
    dot_current: { width: 20, backgroundColor: COLORS.accent },
});
