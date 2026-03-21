import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";

const MOCK = { today: 287000, week: 1840000, month: 7650000, trips_today: 12, rating: 4.87 };

const PERIODS = ["Bugun", "Hafta", "Oy"] as const;

export default function EarningsScreen() {
  const [period, setPeriod] = useState<typeof PERIODS[number]>("Bugun");
  const amount = period === "Bugun" ? MOCK.today : period === "Hafta" ? MOCK.week : MOCK.month;

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={s.title}>Daromad</Text>

      <View style={s.tabs}>
        {PERIODS.map(p => (
          <TouchableOpacity key={p} style={[s.tab, period === p && s.tabActive]} onPress={() => setPeriod(p)}>
            <Text style={[s.tabText, period === p && s.tabTextActive]}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.mainCard}>
        <Text style={s.amountLabel}>Jami daromad</Text>
        <Text style={s.amount}>{amount.toLocaleString("ru-RU")} so'm</Text>
        {period === "Bugun" && <Text style={s.sub}>{MOCK.trips_today} ta buyurtma</Text>}
      </View>

      <View style={s.statsRow}>
        <View style={s.statCard}>
          <Text style={s.statValue}>⭐ {MOCK.rating}</Text>
          <Text style={s.statLabel}>Reyting</Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statValue}>🚗 {MOCK.trips_today}</Text>
          <Text style={s.statLabel}>Bugungi sayohat</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", padding: 16 },
  title: { fontSize: 26, fontWeight: "900", color: "#1e293b", marginBottom: 20 },
  tabs: { flexDirection: "row", backgroundColor: "#e2e8f0", borderRadius: 14, padding: 4, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: "center" },
  tabActive: { backgroundColor: "#fff", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 14, fontWeight: "600", color: "#64748b" },
  tabTextActive: { color: "#F46A0A", fontWeight: "800" },
  mainCard: { backgroundColor: "#F46A0A", borderRadius: 24, padding: 28, alignItems: "center", marginBottom: 16 },
  amountLabel: { color: "rgba(255,255,255,0.8)", fontSize: 14, fontWeight: "600", marginBottom: 8 },
  amount: { color: "#fff", fontSize: 34, fontWeight: "900" },
  sub: { color: "rgba(255,255,255,0.8)", fontSize: 14, marginTop: 6 },
  statsRow: { flexDirection: "row", gap: 12 },
  statCard: { flex: 1, backgroundColor: "#fff", borderRadius: 20, padding: 20, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  statValue: { fontSize: 22, fontWeight: "800", color: "#1e293b", marginBottom: 6 },
  statLabel: { fontSize: 12, color: "#94a3b8", fontWeight: "600" },
});
