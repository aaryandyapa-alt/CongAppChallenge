import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { load_info, load_output } from "../../storage.js";

// placeholder until step 8; shows that the run was saved, and (temporarily) how long the simulation took
export default function ResultsScreen()
{
    const { name, from, took } = useLocalSearchParams();
    const [saved, set_saved] = useState("checking…");

    useEffect(() =>
    {
        Promise.all([load_info(name), load_output(name)])
            .then(([info, output]) => set_saved(info && output ? `yes, ${Object.keys(output).join(", ")}` : "no"))
            .catch((e) => set_saved(`error: ${e.message}`));
    }, [name]);

    return (
        <View style={styles.container}>
            <Text>Results: {name}</Text>
            <Text>Opened from: {from ?? "Home"}</Text>
            {took ? <Text style={styles.took}>Simulation took {took} s</Text> : null}
            <Text>Saved: {saved}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, padding: 20 },
    took: { fontSize: 22, fontWeight: "600" },
});
