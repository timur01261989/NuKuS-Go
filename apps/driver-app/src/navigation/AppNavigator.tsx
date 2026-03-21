import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import HomeScreen        from "../screens/HomeScreen";
import EarningsScreen    from "../screens/EarningsScreen";
import OrderRadarScreen  from "../screens/OrderRadarScreen";
import ProfileScreen     from "../screens/ProfileScreen";

type Tab = "home" | "radar" | "earnings" | "profile";

export default function AppNavigator() {
  const [tab, setTab] = React.useState<Tab>("home");

  const screens: Record<Tab, React.ReactNode> = {
    home:     <HomeScreen />,
    radar:    <OrderRadarScreen />,
    earnings: <EarningsScreen />,
    profile:  <ProfileScreen />,
  };

  const tabs: { key: Tab; icon: string; label: string }[] = [
    { key: "home",     icon: "🏠", label: "Asosiy" },
    { key: "radar",    icon: "📡", label: "Radar" },
    { key: "earnings", icon: "💰", label: "Daromad" },
    { key: "profile",  icon: "👤", label: "Profil" },
  ];

  return (
    <View style={s.container}>
      <View style={s.screen}>{screens[tab]}</View>
      <View style={s.tabBar}>
        {tabs.map(t => (
          <TouchableOpacity key={t.key} style={s.tabItem} onPress={() => setTab(t.key)}>
            <Text style={[s.icon, tab === t.key && s.iconActive]}>{t.icon}</Text>
            <Text style={[s.label, tab === t.key && s.labelActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  screen: { flex: 1 },
  tabBar: { flexDirection: "row", backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#f1f5f9", paddingBottom: 8, paddingTop: 8 },
  tabItem: { flex: 1, alignItems: "center", paddingVertical: 4 },
  icon: { fontSize: 22, opacity: 0.4 },
  iconActive: { opacity: 1 },
  label: { fontSize: 10, fontWeight: "600", color: "#94a3b8", marginTop: 2 },
  labelActive: { color: "#F46A0A", fontWeight: "800" },
});
