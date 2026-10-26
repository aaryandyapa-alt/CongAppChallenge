import { Tabs, router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@react-native-vector-icons/ionicons";

import { COLORS, PANEL_SHADOW, RADIUS, TAB_BAR } from "../../components/theme.js";

// a bit bigger than the default (about 25), since the tabs have no labels
const ICON_SIZE = 28;
const PILL = { width: 60, height: 42 };

// a tab's icon; the active one is filled and sits in a soft lime pill
function TabIcon({ name, focused, color })
{
    return (
        <View style={[styles.pill, focused && styles.pill_active]}>
            <Ionicons name={focused ? name : `${name}-outline`} color={color} size={ICON_SIZE} />
        </View>
    );
}

export default function TabsLayout()
{
    const insets = useSafeAreaInsets();

    return (
        <Tabs
            // the bar floats above the home indicator itself (tabBarStyle.bottom), so it needs no space added inside it
            safeAreaInsets={{ bottom: 0 }}
            screenOptions={{
                // a solid cream pill (the page's own color) floating above the bottom of the screen.
                // Screens leave room for it at their bottom (TAB_BAR in theme.js), since their content runs underneath it.
                // The color is on the bar itself (not a separate background layer), so nothing can show through it
                tabBarStyle: {
                    position: "absolute", bottom: insets.bottom + TAB_BAR.gap, marginHorizontal: 20,
                    height: TAB_BAR.height, paddingTop: 0, paddingBottom: 0,
                    borderTopWidth: 0, borderRadius: RADIUS.pill, elevation: 0,
                    backgroundColor: COLORS.background,
                    ...PANEL_SHADOW,
                },
                // the active tab is ink with a filled icon in a lime pill; the others are slate outlines
                tabBarActiveTintColor: COLORS.text,
                tabBarInactiveTintColor: COLORS.text_faint,
                // icons only, centered in the bar; each tab's name is still read out by screen readers
                tabBarShowLabel: false,
                // each tab lays its icon out from the top (with 5 of padding), not centered, so the icon's box is
                // stretched to fill the tab's height instead; the icon is centered inside its box
                tabBarIconStyle: { flex: 1, width: PILL.width },
                // each tab draws its own top (BrandHeader) instead of a header bar
                headerShown: false,
                sceneStyle: { backgroundColor: COLORS.background },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Home",
                    tabBarIcon: ({ color, focused }) => <TabIcon name="home" focused={focused} color={color} />,
                }}
            />
            <Tabs.Screen
                name="add"
                options={{
                    title: "New",
                    tabBarIcon: ({ color }) => <TabIcon name="add-circle" focused={false} color={color} />,
                }}
                listeners={{
                    // the add tab never shows its own screen; it opens New run on top of the tabs
                    tabPress: (e) =>
                    {
                        e.preventDefault();
                        router.push("/new-run");
                    },
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: "Settings",
                    tabBarIcon: ({ color, focused }) => <TabIcon name="settings" focused={focused} color={color} />,
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    pill: { ...PILL, borderRadius: PILL.height / 2, alignItems: "center", justifyContent: "center" },
    pill_active: { backgroundColor: COLORS.accent_tint_strong },
});
