import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from "react-native";

const MOCK_DRIVER = { name: "Jasur Toshmatov", phone: "+998 90 123 45 67", plate: "01 A 234 BC", vehicle: "Chevrolet Cobalt 2022", rating: 4.87, trips: 1247, joined: "Feb 2024" };

export default function ProfileScreen() {
  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={s.header}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{MOCK_DRIVER.name.charAt(0)}</Text>
        </View>
        <View style={s.info}>
          <Text style={s.name}>{MOCK_DRIVER.name}</Text>
          <Text style={s.phone}>{MOCK_DRIVER.phone}</Text>
          <View style={s.badge}><Text style={s.badgeText}>✓ Tasdiqlangan</Text></View>
        </View>
      </View>

      <View style={s.statsRow}>
        <View style={s.stat}><Text style={s.statVal}>⭐ {MOCK_DRIVER.rating}</Text><Text style={s.statLbl}>Reyting</Text></View>
        <View style={s.stat}><Text style={s.statVal}>🚗 {MOCK_DRIVER.trips}</Text><Text style={s.statLbl}>Sayohatlar</Text></View>
        <View style={s.stat}><Text style={s.statVal}>📅 {MOCK_DRIVER.joined}</Text><Text style={s.statLbl}>A'zo bo'lgan</Text></View>
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>Avtomobil</Text>
        <Text style={s.cardValue}>{MOCK_DRIVER.vehicle}</Text>
        <Text style={[s.cardValue, { color: "#F46A0A", fontWeight: "800" }]}>{MOCK_DRIVER.plate}</Text>
      </View>

      {[
        { icon: "⚙️", label: "Sozlamalar" },
        { icon: "📋", label: "Hujjatlarim" },
        { icon: "💬", label: "Qo'llab-quvvatlash" },
        { icon: "🚪", label: "Chiqish", danger: true },
      ].map(item => (
        <TouchableOpacity key={item.label} style={[s.menuItem, item.danger && { borderColor: "#fecaca" }]}>
          <Text style={s.menuIcon}>{item.icon}</Text>
          <Text style={[s.menuLabel, item.danger && { color: "#ef4444" }]}>{item.label}</Text>
          <Text style={s.menuArrow}>›</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", padding: 16 },
  header: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 20 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#F46A0A", justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 28, fontWeight: "900", color: "#fff" },
  info: { flex: 1 },
  name: { fontSize: 20, fontWeight: "800", color: "#1e293b" },
  phone: { fontSize: 14, color: "#64748b", marginTop: 2 },
  badge: { marginTop: 6, backgroundColor: "#dcfce7", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start" },
  badgeText: { fontSize: 12, color: "#16a34a", fontWeight: "700" },
  statsRow: { flexDirection: "row", backgroundColor: "#fff", borderRadius: 20, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  stat: { flex: 1, alignItems: "center" },
  statVal: { fontSize: 16, fontWeight: "800", color: "#1e293b" },
  statLbl: { fontSize: 11, color: "#94a3b8", marginTop: 2 },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 16 },
  cardTitle: { fontSize: 12, color: "#94a3b8", fontWeight: "600", marginBottom: 6 },
  cardValue: { fontSize: 16, fontWeight: "600", color: "#1e293b" },
  menuItem: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: "#f1f5f9" },
  menuIcon: { fontSize: 20, marginRight: 12 },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: "600", color: "#1e293b" },
  menuArrow: { fontSize: 20, color: "#cbd5e1" },
});
