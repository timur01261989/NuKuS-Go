import React from "react";
import { View, Text, Switch, StyleSheet } from "react-native";
export default function HomeScreen() {
  const [isOnline, setIsOnline] = React.useState(false);
  return (
    <View style={s.container}>
      <Text style={s.title}>UniGo Driver</Text>
      <View style={s.row}>
        <Text style={s.label}>{isOnline ? "Online" : "Offline"}</Text>
        <Switch value={isOnline} onValueChange={setIsOnline} />
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 28, fontWeight: "900", color: "#F46A0A", marginBottom: 24 },
  row: { flexDirection: "row", alignItems: "center", gap: 16 },
  label: { fontSize: 18, fontWeight: "600" },
});
