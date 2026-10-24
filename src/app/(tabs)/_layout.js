import { Tabs, router } from "expo-router";
import { Ionicons } from "@react-native-vector-icons/ionicons";

export default function TabsLayout()
{
    return (
        <Tabs>
            <Tabs.Screen
                name="index"
                options={{
                    title: "Home",
                    tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} />,
                }}
            />
            <Tabs.Screen
                name="add"
                options={{
                    title: "New",
                    tabBarIcon: ({ color, size }) => <Ionicons name="add-circle-outline" color={color} size={size} />,
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
                    tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" color={color} size={size} />,
                }}
            />
        </Tabs>
    );
}
