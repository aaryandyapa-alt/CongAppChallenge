/**
 * Every color in the app, named by what it's for. Change a value here and every screen that uses it follows.
 * Screens use these as COLORS.accent and so on; there should be no color codes anywhere else.
 */
export const COLORS = {
    // brand blue: buttons, links, selected items, progress
    accent: "#1d5fd1",
    accent_light: "#eef3fc",       // selected list rows, changed stations in the path diagram
    accent_disabled: "#9bb3e0",    // a disabled blue button
    on_accent: "#fff",             // text and icons on blue (or red) buttons

    // backgrounds
    background: "#f7f7f7",         // behind everything
    surface: "#fff",               // boxes, cards, bars, inputs

    // text, darkest to lightest
    text: "#1a1a1a",
    text_secondary: "#444",
    text_muted: "#555",
    text_faint: "#666",
    text_detail: "#777",           // technical detail, like the simulation error message
    placeholder: "#888",
    text_tiny: "#999",             // the smallest notes

    // lines
    border: "#c4c4c4",             // input and card outlines
    divider: "#e2e2e2",            // lines between sections, top of bottom bars
    track: "#d9d9d9",              // the unfilled part of the progress bar

    // problems
    error: "#b3261e",
    error_light: "#fbe4e2",

    // AI stars and warnings
    starred: "#c77700",
    starred_light: "#fdf4e3",
    warning_text: "#7a4a00",
    warning_divider: "#e8c98f",

    // effects
    shadow: "#000",
    backdrop: "rgba(0,0,0,0.4)",   // dims the screen behind a dropdown list
};
