import { Stack, router } from "expo-router";
import { useRef, useState } from "react";
import { FlatList, Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@react-native-vector-icons/ionicons";

import { COLORS } from "../components/theme.js";
import { check_run_name } from "../lib/form_checks.js";
import { SAMPLE_NAME, SAMPLE_SCHEMA } from "../lib/sample_run.js";
import { useDraftRun } from "../state/DraftRunContext.js";
import { useSettings } from "../state/SettingsContext.js";
import { list_runs } from "../storage.js";

/**
 * The slides. Each has an icon, a title and text, and can also have a picture (usually a cropped screenshot) shown
 * above the title in place of the icon. To add one:
 *   1. put the image in assets/tutorial/, e.g. assets/tutorial/check-details.png
 *   2. set image: require("../../assets/tutorial/check-details.png") on that slide
 *   3. set image_label to a short description for screen readers, e.g. "A review page with a starred field"
 * Slides with image: null keep their icon.
 */
const SLIDES = [
    {
        image: null,
        image_label: null,
        icon: "people-outline",
        title: "Welcome to ShiftLime",
        text: "Plan your queue before the rush. Describe how people move through your site, and ShiftLime tests every way to split your workers.",
    },
    {
        image: null,
        image_label: null,
        icon: "create-outline",
        title: "Describe your site",
        text: "Choose Simple to answer five questions in your own words (we'll fill in the details for you to check) or Advanced to set everything yourself.",
    },
    {
        image: null,
        image_label: null,
        icon: "checkmark-done-outline",
        title: "Check the details",
        text: "Go through a few short pages. Anything marked ★ in amber was a guess, so give it a look. Red means something still needs fixing.",
    },
    {
        image: null,
        image_label: null,
        icon: "bar-chart-outline",
        title: "See what works best",
        text: "ShiftLime compares the shortest average wait, the shortest long waits, and the most even workload. You choose what matters most for your site.",
    },
    {
        image: null,
        image_label: null,
        icon: "rocket-outline",
        title: "Ready?",
        text: "Start your own run, or try a sample run to see how it all works.",
    },
];

// "Sample run", or "Sample run 2", "Sample run 3"... if that name is taken
function sample_name()
{
    const existing = list_runs();
    let name = SAMPLE_NAME;
    for (let n = 2; check_run_name(name, existing) !== null; n++)
        name = `${SAMPLE_NAME} ${n}`;
    return name;
}

/**
 * The welcome tutorial: shown once on first launch (from Home), and again from Settings > About > Replay tutorial.
 * Finishing or skipping it marks it seen, so it isn't shown on launch again.
 */
export default function TutorialScreen()
{
    const { width } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const { change_setting } = useSettings();
    const { begin_duplicate, set_name, go_to_page } = useDraftRun();
    const list = useRef(null);
    const [index, set_index] = useState(0);
    const is_last = index === SLIDES.length - 1;

    function go_to(i)
    {
        set_index(i);
        list.current?.scrollToIndex({ index: i, animated: true });
    }

    // Skip, and closing the tutorial any other way, all count as having seen it
    function close(then)
    {
        change_setting("seen_tutorial", true);
        then();
    }

    const skip = () => close(() => router.back());
    const start_own = () => close(() => router.replace("/new-run"));
    // loads the sample as a Simple run on its Summary page, one tap from Start simulation
    const try_sample = () => close(() =>
    {
        begin_duplicate("simple", SAMPLE_SCHEMA);
        set_name(sample_name());
        // past the last page; review.js shows the last page (Summary)
        go_to_page(999);
        router.replace("/review");
    });

    return (
        <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.top_bar}>
                {!is_last ? (
                    <Pressable onPress={skip} hitSlop={12} accessibilityRole="button" accessibilityLabel="Skip the tutorial">
                        <Text style={styles.skip}>Skip</Text>
                    </Pressable>
                ) : null}
            </View>

            <FlatList
                ref={list}
                data={SLIDES}
                keyExtractor={(slide) => slide.title}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
                onMomentumScrollEnd={(e) => set_index(Math.round(e.nativeEvent.contentOffset.x / width))}
                renderItem={({ item }) => (
                    <View
                        style={[styles.slide, { width: width }]}
                        accessible
                        accessibilityLabel={`${item.title}. ${item.text}${item.image && item.image_label ? ` Picture: ${item.image_label}.` : ""}`}
                    >
                        {item.image ? (
                            // the picture takes the space above the text, scaled to fit without cropping or stretching
                            <View style={styles.picture_area}>
                                <Image source={item.image} style={styles.picture} resizeMode="contain" />
                            </View>
                        ) : (
                            <View style={styles.icon_circle}>
                                <Ionicons name={item.icon} size={56} color={COLORS.accent} />
                            </View>
                        )}
                        <Text style={styles.title}>{item.title}</Text>
                        <Text style={styles.text}>{item.text}</Text>
                    </View>
                )}
            />

            <View style={styles.dots} accessibilityLabel={`Slide ${index + 1} of ${SLIDES.length}`}>
                {SLIDES.map((slide, i) => (
                    <View key={slide.title} style={[styles.dot, i === index && styles.dot_current]} />
                ))}
            </View>

            <View style={styles.buttons}>
                {is_last ? (
                    <>
                        <Pressable style={styles.primary} onPress={start_own} accessibilityRole="button">
                            <Text style={styles.primary_text}>Start my own</Text>
                        </Pressable>
                        <Pressable style={styles.secondary} onPress={try_sample} accessibilityRole="button" accessibilityHint="Loads an example food bank run, ready to simulate">
                            <Ionicons name="play-circle-outline" size={20} color={COLORS.accent} />
                            <Text style={styles.secondary_text}>Try a sample run</Text>
                        </Pressable>
                    </>
                ) : (
                    <Pressable style={styles.primary} onPress={() => go_to(index + 1)} accessibilityRole="button">
                        <Text style={styles.primary_text}>Next</Text>
                    </Pressable>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: COLORS.background },
    // keeps the same height whether or not Skip is showing, so the slides don't jump
    top_bar: { height: 48, paddingHorizontal: 20, alignItems: "flex-end", justifyContent: "center" },
    skip: { fontSize: 17, fontWeight: "600", color: COLORS.accent },
    slide: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 20 },
    // grows to fill the room above the title and text; the picture scales down inside it
    picture_area: { flex: 1, alignSelf: "stretch", minHeight: 160, marginTop: 8 },
    picture: { width: "100%", height: "100%" },
    icon_circle: { width: 112, height: 112, borderRadius: 56, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.accent_light },
    title: { fontSize: 26, fontWeight: "700", color: COLORS.text, textAlign: "center" },
    text: { fontSize: 18, lineHeight: 26, color: COLORS.text_secondary, textAlign: "center" },
    dots: { flexDirection: "row", justifyContent: "center", gap: 8, paddingVertical: 16 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.track },
    dot_current: { width: 22, backgroundColor: COLORS.accent },
    buttons: { paddingHorizontal: 20, paddingBottom: 16, gap: 10 },
    primary: { minHeight: 52, borderRadius: 8, backgroundColor: COLORS.accent, alignItems: "center", justifyContent: "center" },
    primary_text: { fontSize: 18, fontWeight: "600", color: COLORS.on_accent },
    secondary: { minHeight: 52, borderRadius: 8, borderWidth: 2, borderColor: COLORS.accent, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.surface },
    secondary_text: { fontSize: 18, fontWeight: "600", color: COLORS.accent },
});
