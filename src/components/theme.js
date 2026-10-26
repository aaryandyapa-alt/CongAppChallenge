/**
 * Every color, shadow, font and corner size in the app, named by what it's for. Change a value here and every
 * screen that uses it follows; there should be no color codes anywhere else.
 *
 * There are two themes, LIGHT and DARK, with the same names in each. Screens don't import colors directly:
 * they get the current theme from components/ThemeContext.js (useTheme, useThemedStyles), so they follow the
 * Appearance setting (Light / Dark / System). Fonts, corner sizes and spacing are the same in both and are imported
 * directly from here.
 *
 * ShiftLime look (inspired by GastroLens): a cream-white page with soft lime glows, frosted white "glass" cards with
 * wide faint shadows, lime pill buttons with a glow, small uppercase labels and Plus Jakarta Sans. Dark mode is the
 * same look at night: a deep green-black page with dim lime glows and dark glass cards.
 * Lime is too light for text on light backgrounds (1.8:1), so there it's only a fill with dark text on top; green
 * text and icons use accent_text / accent_deep instead. Every text color is at least 4.5:1 on its theme's cards,
 * page, and the strongest part of a glow.
 */

const LIGHT_COLORS = {
    // brand lime: button fills, the progress bar, selected items
    accent: "#7FD46A",
    accent_text: "#4C7F40",        // green icons, outlines and larger green text (user's chosen green)
    accent_deep: "#3F6F34",        // small green text, like the uppercase labels (5:1 even on a glow)
    accent_light: "#EAF7E5",       // selected list rows, changed stations in the path diagram
    accent_tint: "rgba(127, 212, 106, 0.18)",  // soft lime washes: tinted chips, icon circles
    accent_tint_strong: "rgba(127, 212, 106, 0.28)",  // the active tab's pill
    accent_disabled: "#C9EBBF",    // a disabled lime button
    on_accent: "#1F2E24",          // text and icons on lime (also on the green band)

    // backgrounds: a cream-white page (with GlowBackground's lime glows on top) and frosted white glass cards
    background: "#FAFCF4",         // behind everything; also the solid tab bar and bottom bars
    surface: "rgba(255, 255, 255, 0.82)",  // glass: cards, inputs, round buttons
    surface_solid: "#FFFFFF",      // where nothing should show through (pop-up boxes, inside outline buttons)
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

const DARK_COLORS = {
    accent: "#7FD46A",
    accent_text: "#8FDC7A",        // lime is light enough to use as green text and icons on dark
    accent_deep: "#9BE287",
    accent_light: "#203320",       // changed stations and selected rows: a deep green tint
    accent_tint: "rgba(127, 212, 106, 0.16)",
    accent_tint_strong: "rgba(127, 212, 106, 0.26)",
    accent_disabled: "#3B5235",
    on_accent: "#14200F",          // dark ink stays on lime in both themes

    // a deep green-black page and dark glass cards
    background: "#0F1611",
    surface: "rgba(31, 43, 34, 0.86)",
    surface_solid: "#1B251E",
    glass_edge: "rgba(255, 255, 255, 0.06)",

    // pale green-tinted greys
    text: "#EAF2E6",
    text_secondary: "#CFDBCD",
    text_muted: "#B5C4B5",
    text_faint: "#A1B2A2",
    text_detail: "#97A898",
    placeholder: "#7F9081",
    text_tiny: "#97A898",

    border: "#6E8071",
    divider: "rgba(234, 242, 230, 0.10)",
    track: "#28342B",
    segment_track: "rgba(234, 242, 230, 0.08)",

    error: "#FF8A80",
    error_light: "#3B1F1C",

    starred: "#F0A030",
    starred_light: "#3A2C12",
    warning_text: "#F5C46B",
    warning_divider: "#6B5326",

    shadow: "#000",
    backdrop: "rgba(0, 0, 0, 0.6)",
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
 * How the tops of Home and Settings look: "glass" (frosted bar over the glow, like GastroLens)
 * or "green" (the full lime band). Switch here to compare.
 */
export const HEADER_STYLE = "green";

// for text that must sit exactly in the middle of a button or switch: Android adds extra space above
// Plus Jakarta Sans's letters unless this is turned off
export const CENTERED_TEXT = { includeFontPadding: false, textAlignVertical: "center" };

// the floating tab bar on Home and Settings: its height and its gap above the bottom of the screen.
// It's filled with the page's color (COLORS.background), solid so nothing shows through
export const TAB_BAR = { height: 64, gap: 10 };

// gradients are all drawn from the top-left corner to the bottom-right
export const GRADIENT_START = { x: 0, y: 0 };
export const GRADIENT_END = { x: 1, y: 1 };

/**
 * Builds one theme. Each theme has the same names, so screens can use whichever is current:
 *   COLORS        - the colors above
 *   EYEBROW       - the small uppercase label above a title or section ("PAGE 2 OF 6", "DISPLAY"); spread into a text style
 *   CARD_SHADOW   - the wide, faint shadow under glass cards instead of an outline
 *   PANEL_SHADOW  - bigger and softer, for panels floating over the page (tab bar, bottom bars, pop-ups)
 *   BUTTON_GLOW   - a soft lime glow under the main buttons and the round New button (FLOATING_SHADOW is the same)
 *   HEADER_SHADOW - under the tops of Review and Results
 *   BRAND_SHADOW  - under the green band on Home and Settings
 *   CURRENT_GLOW  - around the current page's circle on the review progress bar
 *   STARRED_BOX   - box colors for a field the AI couldn't fill (amber)
 *   GLOWS         - the radial gradients behind every screen (components/GlowBackground.js)
 *   GRADIENTS     - the linear gradients used through components/Gradient.js
 * boxShadow ("x y blur spread color") draws the same on Android and iOS.
 */
function make_theme(name, colors, shadow_color, shadow_strength, glow_strength, gradients)
{
    const shadow = (y, blur, opacity) => ({ boxShadow: `0px ${y}px ${blur}px 0px rgba(${shadow_color}, ${Math.min(opacity * shadow_strength, 0.5).toFixed(3)})` });
    const button_glow = { boxShadow: `0px 10px 24px 0px rgba(95, 163, 78, ${name === "dark" ? 0.22 : 0.32})` };
    const glow = (opacity) => (opacity * glow_strength).toFixed(3);
    return {
        name: name,
        dark: name === "dark",
        COLORS: colors,
        EYEBROW: {
            fontFamily: FONTS.bold,
            fontSize: 12,
            letterSpacing: 2.2,
            textTransform: "uppercase",
            color: colors.accent_deep,
        },
        CARD_SHADOW: shadow(12, 30, 0.07),
        PANEL_SHADOW: shadow(18, 44, 0.12),
        BUTTON_GLOW: button_glow,
        FLOATING_SHADOW: button_glow,
        HEADER_SHADOW: shadow(10, 28, 0.08),
        BRAND_SHADOW: shadow(4, 14, 0.16),
        CURRENT_GLOW: { boxShadow: `0px 0px 0px 5px rgba(127, 212, 106, ${name === "dark" ? 0.4 : 0.3})` },
        STARRED_BOX: { borderColor: colors.starred, backgroundColor: colors.starred_light },
        GLOWS: [
            `radial-gradient(circle at 0% 0%, rgba(127, 212, 106, ${glow(0.30)}) 0%, rgba(127, 212, 106, 0) 55%)`,
            `radial-gradient(circle at 100% 8%, rgba(105, 213, 175, ${glow(0.20)}) 0%, rgba(105, 213, 175, 0) 50%)`,
            `radial-gradient(circle at 100% 100%, rgba(163, 229, 143, ${glow(0.16)}) 0%, rgba(163, 229, 143, 0) 50%)`,
        ],
        GRADIENTS: gradients,
    };
}

export const LIGHT = make_theme("light", LIGHT_COLORS, "31, 46, 36", 1, 1, {
    // main buttons, the round New button, progress bar fills, selected switch options (ink on it 10:1 to 7:1)
    button: ["#A3E58F", "#6CC657"],
    // the full-green band at the top of Home and Settings when HEADER_STYLE is "green"
    brand: ["#A3E58F", "#6CC657"],
    // the rings of outlined buttons (OutlineButton): green, and red for deleting. Both ends are at least 3:1 on the boxes
    outline: ["#5FA34E", "#3E6E33"],
    outline_danger: ["#E0574C", "#9E1F17"],
    // review progress circles for pages with problems (red) or starred values to check (amber); ink numbers at least 5:1
    error: ["#F7B8B1", "#EE8F86"],
    starred: ["#FFD48A", "#F5B547"],
    // soft circles behind icons (tutorial slides, pop-ups, loading)
    soft: ["#F3FBEE", "#D9F1CE"],
});

// shadows are black and much stronger in the dark (a faint ink shadow can't be seen on a dark page); glows are dimmer
export const DARK = make_theme("dark", DARK_COLORS, "0, 0, 0", 4.5, 0.55, {
    button: ["#A3E58F", "#6CC657"],
    brand: ["#8ED67A", "#5DB24A"],
    outline: ["#8FDC7A", "#5FA34E"],
    outline_danger: ["#FF9A90", "#E0574C"],
    error: ["#F7B8B1", "#EE8F86"],
    starred: ["#FFD48A", "#F5B547"],
    soft: ["#1E2E20", "#2B4527"],
});
