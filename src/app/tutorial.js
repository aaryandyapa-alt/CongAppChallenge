import { Asset } from "expo-asset";
import { Stack, router } from "expo-router";
import { useRef, useState } from "react";
import { FlatList, Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@react-native-vector-icons/ionicons";

import GlowBackground from "../components/GlowBackground.js";
import Gradient from "../components/Gradient.js";
import { Mark } from "../components/Logo.js";
import OutlineButton from "../components/OutlineButton.js";
import PrimaryButton from "../components/PrimaryButton.js";
import { FONTS } from "../components/theme.js";
import { SAMPLE_PRACTICE, SAMPLE_SCHEMA, sample_name } from "../lib/sample_run.js";
import { useDraftRun } from "../state/DraftRunContext.js";
import { useSettings } from "../state/SettingsContext.js";
import { useTheme, useThemedStyles } from "../components/ThemeContext.js";

/**
 * The slides. Each has an icon, a title and text, and can also have a picture (usually a cropped screenshot) shown
 * above the title in place of the icon. To add one:
 *   1. put the image in assets/tutorial/, e.g. assets/tutorial/check-details.png
 *   2. set image: require("../../assets/tutorial/check-details.png") on that slide
 *   3. set image_label to a short description for screen readers, e.g. "A review page with a starred field"
 * Slides with image: null keep their icon; mark: true shows the ShiftLime clock instead, at the same size.
 */
const SLIDES = [
    {
        image: null,
        image_label: null,
        mark: true,
        icon: "people-outline",
        title: "Welcome to ShiftLime",
        text: "Plan your queue before the rush. Describe how people move through your site, and ShiftLime tests every way to split your workers.",
    },
    {
        image: require("../../assets/tutorial/questions_rounded.png"),
        image_label: "The Simple mode questions screen, starting with: what are the steps someone goes through, in order?",
        icon: "create-outline",
        title: "Describe your site",
        text: "Choose Simple to answer five questions in your own words (we'll fill in the details for you to check) or Advanced to set everything yourself.",
    },
    {
        image: require("../../assets/tutorial/review_rounded_new.png"),
        image_label: "A review page about arrivals: a field in red that still needs a number, and a starred amber dropdown to check, with matching red and amber circles on the progress bar",
        icon: "checkmark-done-outline",
        title: "Check the details",
        text: "Go through a few short pages. Anything marked ★ in amber was a guess, so give it a look. Red means something still needs fixing.",
    },
    {
        image: require("../../assets/tutorial/results_rounded.png"),
        image_label: "A results page showing the shortest average wait: 7.7 minutes, down from 1 hour 21 minutes",
        icon: "bar-chart-outline",
        title: "See what works best",
        text: "ShiftLime compares the shortest average wait, the shortest long waits, and the most even workload. You choose what matters most for your site.",
    },
    {
        image: null,
        image_label: null,
        icon: "rocket-outline",
        title: "Ready?",
        text: "Try a sample run to see how it all works, or go Home and tap New to start your own.",
    },
];

// Start loading the slides' pictures as soon as the app starts (this file is loaded then), not when the tutorial
// opens, so they're ready before anyone swipes to them. Mostly matters in development, where pictures come over the
// network from the computer; in a built app they're on the phone already. A failure just means they load when shown.
Asset.loadAsync(SLIDES.map((slide) => slide.image).filter(Boolean)).catch(() => {});

// the screenshots' rounded corners, as a share of their width (all three are cut at about 92 px of ~1340)
const PICTURE_CORNER = 0.069;

/**
 * A slide's picture: it takes the space above the text, scaled to fit without cropping or stretching, with a soft
 * shadow so it stands out from the page. The shadow is on a frame sized to exactly the picture's visible shape
 * (corners included), so it doesn't outline the empty space around a picture that's narrower than its slot.
 */
function SlidePicture({ source })
{
    const styles = useThemedStyles(make_styles);
    // the space the picture can use, once it's been laid out
    const [area, set_area] = useState(null);
    const { width: picture_width, height: picture_height } = Image.resolveAssetSource(source);

    let frame = null;
    if (area !== null)
    {
        const scale = Math.min(area.width / picture_width, area.height / picture_height);
        const width = picture_width * scale;
        frame = { width: width, height: picture_height * scale, borderRadius: width * PICTURE_CORNER };
    }

    return (
        <View style={styles.picture_area} onLayout={(e) => set_area(e.nativeEvent.layout)}>
            {frame ? (
                <View style={[styles.picture_frame, frame]}>
                    {/* keeps Android's soft fade-in; the pictures are loaded ahead of time (see Asset.loadAsync above),
                        so the fade starts straight away instead of after a blank pause */}
                    <Image source={source} style={styles.picture} resizeMode="contain" />
                </View>
            ) : null}
        </View>
    );
}

/**
 * The welcome tutorial: shown once on first launch (from Home), and again from Settings > About > Replay tutorial.
 * Finishing or skipping it marks it seen, so it isn't shown on launch again.
 */
export default function TutorialScreen()
{
    const { COLORS } = useTheme();
    const styles = useThemedStyles(make_styles);
    const { width } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const { change_setting } = useSettings();
    const { begin_sample, set_name, go_to_page } = useDraftRun();
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
    // back to Home's run list, even when the tutorial was replayed from Settings
    const go_home = () => close(() => router.dismissTo("/"));
    // loads the sample as a Simple run with its practice spots (a few amber and red fields with callouts),
    // then the intro explains them before the first review page
    const try_sample = () => close(() =>
    {
        begin_sample(SAMPLE_SCHEMA, SAMPLE_PRACTICE);
        set_name(sample_name());
        go_to_page(0);
        router.replace("/intro");
    });

    return (
        <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <Stack.Screen options={{ headerShown: false }} />
            <GlowBackground />

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
                // draw every slide up front and keep them attached while off screen, so their pictures are decoded and
                // ready before they're swiped to (by default Android detaches off-screen slides until they come into view)
                initialNumToRender={SLIDES.length}
                windowSize={SLIDES.length * 2 + 1}
                removeClippedSubviews={false}
                renderItem={({ item }) => (
                    <View
                        style={[styles.slide, { width: width }]}
                        accessible
                        accessibilityLabel={`${item.title}. ${item.text}${item.image && item.image_label ? ` Picture: ${item.image_label}.` : ""}`}
                    >
                        {item.image ? (
                            <SlidePicture source={item.image} />
                        ) : item.mark ? (
                            <Mark size={150} />
                        ) : (
                            <Gradient name="soft" style={styles.icon_circle}>
                                <Ionicons name={item.icon} size={56} color={COLORS.accent_text} />
                            </Gradient>
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
                        {/* the sample run is the main (lime) button: the best way to learn the app */}
                        <PrimaryButton
                            label="Try a sample run"
                            icon="play-circle-outline"
                            on_press={try_sample}
                            hint="Loads an example food bank run with a few marked fields to practice on"
                        />
                        <OutlineButton label="Home" icon="home-outline" on_press={go_home} />
                    </>
                ) : (
                    <PrimaryButton label="Next" on_press={() => go_to(index + 1)} />
                )}
            </View>
        </View>
    );
}

const make_styles = ({ COLORS, PANEL_SHADOW }) => StyleSheet.create({
    screen: { flex: 1, backgroundColor: COLORS.background },
    // keeps the same height whether or not Skip is showing, so the slides don't jump
    top_bar: { height: 48, paddingHorizontal: 20, alignItems: "flex-end", justifyContent: "center" },
    skip: { fontSize: 16, fontFamily: FONTS.bold, color: COLORS.accent_deep },
    slide: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 20 },
    // grows to fill the room above the title and text; the picture scales down inside it
    // the picture is centered in the space it has
    picture_area: { flex: 1, alignSelf: "stretch", minHeight: 160, marginTop: 8, alignItems: "center", justifyContent: "center" },
    // the soft, wide shadow that floating panels use; its corners follow the screenshot's
    picture_frame: { ...PANEL_SHADOW },
    picture: { width: "100%", height: "100%" },
    // with a soft lime glow around it
    icon_circle: {
        width: 120, height: 120, borderRadius: 60, alignItems: "center", justifyContent: "center",
        boxShadow: "0px 0px 0px 10px rgba(127, 212, 106, 0.12)",
    },
    title: { fontSize: 28, fontFamily: FONTS.extrabold, color: COLORS.text, textAlign: "center", letterSpacing: -0.6, lineHeight: 34 },
    text: { fontFamily: FONTS.regular, fontSize: 17, lineHeight: 26, color: COLORS.text_secondary, textAlign: "center" },
    dots: { flexDirection: "row", justifyContent: "center", gap: 8, paddingVertical: 16 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.track },
    dot_current: { width: 22, backgroundColor: COLORS.accent },
    buttons: { paddingHorizontal: 20, paddingBottom: 16, gap: 10 },
});
