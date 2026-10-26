/**
 * Every color, shadow, font and corner size in the app, named by what it's for. Change a value here and every
 * screen that uses it follows. Screens use these as COLORS.accent and so on; there should be no color codes anywhere else.
 *
 * ShiftLime look (inspired by GastroLens): a cream-white page with soft lime glows, frosted white "glass" cards with
 * wide faint shadows, lime pill buttons with a glow, small uppercase labels and Plus Jakarta Sans.
 * Lime is too light for text (1.8:1), so it's only used as a fill with dark text on top; green text and icons use
 * the deeper accent_text / accent_deep instead. Every text color here is at least 4.5:1 on white, on the page,
 * and on the strongest part of a glow.
 */
export const COLORS = {
    // brand lime: button fills, the progress bar, selected items
    accent: "#7FD46A",
    accent_text: "#4C7F40",        // green icons, outlines and larger green text (user's chosen green)
    accent_deep: "#3F6F34",        // small green text, like the uppercase labels (5:1 even on a glow)
    accent_light: "#EAF7E5",       // selected list rows, changed stations in the path diagram
    accent_tint: "rgba(127, 212, 106, 0.18)",  // soft lime washes: tinted chips, icon circles
    accent_tint_strong: "rgba(127, 212, 106, 0.28)",  // the active tab's pill
    accent_disabled: "#C9EBBF",    // a disabled lime button
    on_accent: "#1F2E24",          // text and icons on lime

    // backgrounds: a cream-white page (with GlowBackground's lime glows on top) and frosted white glass cards
    background: "#FAFCF4",         // behind everything
    surface: "rgba(255, 255, 255, 0.82)",  // glass: cards, bars, inputs, round buttons
    surface_solid: "#FFFFFF",      // where nothing should show through (pop-up boxes)
    glass_edge: "rgba(255, 255, 255, 0.9)",  // the thin bright edge that makes glass panels look crisp

    // text, darkest to lightest: a green-tinted charcoal ("ink") and tinted slates instead of plain greys
    text: "#1F2E24",
    text_secondary: "#36463A",
    text_muted: "#44564A",
    text_faint: "#4F6154",
    text_detail: "#56685A",        // technical detail, like the simulation error message
    placeholder: "#7A8A7D",
    text_tiny: "#56685A",          // the smallest notes

    // lines
    border: "#859287",             // input box outlines: 3:1 against the boxes so inputs are easy to see
    divider: "rgba(31, 46, 36, 0.08)",   // lines between sections
    track: "#E7ECE2",              // the unfilled part of progress bars (solid, so circles don't show the bar through them)
    segment_track: "rgba(31, 46, 36, 0.07)",   // behind pill-shaped switches (mode, AM / PM)

    // problems
    error: "#B3261E",
    error_light: "#FBE4E2",

    // AI stars and warnings
    starred: "#C77700",
    starred_light: "#FCE9C8",
    warning_text: "#7A4A00",
    warning_divider: "#E8C98F",

    // effects
    shadow: "#000",
    backdrop: "rgba(20, 32, 24, 0.45)",   // dims the screen behind pop-ups and dropdown lists
};

/**
 * Plus Jakarta Sans, one family per weight (Android can't pick a weight of a loaded font by fontWeight).
 * Use fontFamily: FONTS.bold instead of fontWeight: "700". Loaded in src/app/_layout.js.
 */
export const FONTS = {
    regular: "PlusJakartaSans_400Regular",
    medium: "PlusJakartaSans_500Medium",
    semibold: "PlusJakartaSans_600SemiBold",
    bold: "PlusJakartaSans_700Bold",
    extrabold: "PlusJakartaSans_800ExtraBold",
    italic: "PlusJakartaSans_400Regular_Italic",
};

// corner sizes: glass panels and bars, cards inside them, inputs, and fully round pills
export const RADIUS = {
    panel: 28,
    card: 20,
    input: 14,
    pill: 999,
};

/**
 * The small uppercase label above a title or section ("PAGE 2 OF 6", "DISPLAY"), widely letter-spaced.
 * Spread it into a text style.
 */
export const EYEBROW = {
    fontFamily: FONTS.bold,
    fontSize: 12,
    letterSpacing: 2.2,
    textTransform: "uppercase",
    color: COLORS.accent_deep,
};

/**
 * The wide, faint shadow under glass cards (run rows, Settings cards, results rows, station boxes) instead of an outline.
 * Tinted with the ink color rather than grey. Spread it into a style: card: { ...CARD_SHADOW, ... }.
 * boxShadow ("x y blur spread color") draws the same on Android and iOS.
 */
export const CARD_SHADOW = {
    boxShadow: "0px 12px 30px 0px rgba(31, 46, 36, 0.07)",
};

// bigger and softer, for panels floating over the page: the tab bar, bottom bars, pop-up boxes
export const PANEL_SHADOW = {
    boxShadow: "0px 18px 44px 0px rgba(31, 46, 36, 0.12)",
};

// a soft lime glow under the main buttons and the round New button
export const BUTTON_GLOW = {
    boxShadow: "0px 10px 24px 0px rgba(95, 163, 78, 0.32)",
};
export const FLOATING_SHADOW = BUTTON_GLOW;

// a soft shadow under the top of Review and Results, separating it from the page scrolling underneath
export const HEADER_SHADOW = {
    boxShadow: "0px 10px 28px 0px rgba(31, 46, 36, 0.08)",
};

// a soft lime glow around the current page's circle on the review progress bar (instead of an outline)
export const CURRENT_GLOW = {
    boxShadow: "0px 0px 0px 5px rgba(127, 212, 106, 0.30)",
};

/**
 * The soft glows behind every screen (components/GlowBackground.js): radial gradients that fade to nothing.
 */
export const GLOWS = [
    "radial-gradient(circle at 0% 0%, rgba(127, 212, 106, 0.30) 0%, rgba(127, 212, 106, 0) 55%)",
    "radial-gradient(circle at 100% 8%, rgba(105, 213, 175, 0.20) 0%, rgba(105, 213, 175, 0) 50%)",
    "radial-gradient(circle at 100% 100%, rgba(163, 229, 143, 0.16) 0%, rgba(163, 229, 143, 0) 50%)",
];

/**
 * How the tops of Home and Settings look: "glass" (frosted white bar over the glow, like GastroLens)
 * or "green" (the full lime band). Switch here to compare.
 */
export const HEADER_STYLE = "green";

// a subtle dark shadow under the green band (HEADER_STYLE "green"), softening its edge against the page
export const BRAND_SHADOW = {
    boxShadow: "0px 4px 14px 0px rgba(31, 46, 36, 0.16)",
};

// for text that must sit exactly in the middle of a button or switch: Android adds extra space above
// Plus Jakarta Sans's letters unless this is turned off
export const CENTERED_TEXT = { includeFontPadding: false, textAlignVertical: "center" };

// the floating tab bar on Home and Settings: its height and its gap above the bottom of the screen.
// It's filled with the page's cream (COLORS.background), solid so nothing shows through
export const TAB_BAR = { height: 64, gap: 10 };

/**
 * Gradients, all drawn from the top-left corner to the bottom-right (GRADIENT_START to GRADIENT_END).
 * Use them through components/Gradient.js. Ink on button and brand is 10:1 to 7:1.
 */
export const GRADIENTS = {
    // main buttons, the round New button, progress bar fills, selected switch options
    button: ["#A3E58F", "#6CC657"],
    // the full-green band at the top of Home and Settings when HEADER_STYLE is "green"
    brand: ["#A3E58F", "#6CC657"],
    // the rings of outlined buttons (OutlineButton): green, and red for deleting. Both ends are at least 3:1 on the boxes
    outline: ["#5FA34E", "#3E6E33"],
    outline_danger: ["#E0574C", "#9E1F17"],
    // review progress circles for pages with problems (red) or starred values to check (amber);
    // strong enough to stand out without an outline, ink numbers at least 5:1
    error: ["#F7B8B1", "#EE8F86"],
    starred: ["#FFD48A", "#F5B547"],
    // soft circles behind icons (tutorial slides, pop-ups)
    soft: ["#F3FBEE", "#D9F1CE"],
};
export const GRADIENT_START = { x: 0, y: 0 };
export const GRADIENT_END = { x: 1, y: 1 };
