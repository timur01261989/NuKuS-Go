import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from "react-native";

interface OrderOffer { id: string; pickup_address: string; dropoff_address: string; price_uzs: number; distance_km: number; expires_in: number; }

const MOCK_OFFERS: OrderOffer[] = [
  { id: "1", pickup_address: "Yunusobod, 11-mavze", dropoff_address: "Mirzo Ulug'bek, Qatortol ko'chasi", price_uzs: 18000, distance_km: 4.2, expires_in: 28 },
  { id: "2", pickup_address: "Chilonzor, 9-kvartal", dropoff_address: "Shayxontohur tumani, Beshyog'och", price_uzs: 12000, distance_km: 2.8, expires_in: 45 },
];

export default function OrderRadarScreen() {
  const [offers, setOffers] = useState<OrderOffer[]>(MOCK_OFFERS);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => { setRefreshing(false); }, 1000);
  };

  const accept = (id: string) => setOffers(prev => prev.filter(o => o.id !== id));
  const reject = (id: string) => setOffers(prev => prev.filter(o => o.id !== id));

  return (
    <View style={s.container}>
      <Text style={s.title}>Radar — {offers.length} ta taklif</Text>
      <FlatList
        data={offers}
        keyExtractor={o => o.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F46A0A" />}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyIcon}>📡</Text>
            <Text style={s.emptyText}>Hozir buyurtmalar yo'q</Text>
            <Text style={s.emptySub}>Yangilash uchun pastga torting</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.header}>
              <Text style={s.price}>{item.price_uzs.toLocaleString("ru-RU")} so'm</Text>
              <View style={s.timer}><Text style={s.timerText}>⏱ {item.expires_in}s</Text></View>
            </View>
            <View style={s.route}>
              <Text style={s.routeFrom}>📍 {item.pickup_address}</Text>
              <View style={s.line} />
              <Text style={s.routeTo}>🏁 {item.dropoff_address}</Text>
            </View>
            <Text style={s.distance}>{item.distance_km} km</Text>
            <View style={s.actions}>
              <TouchableOpacity style={s.acceptBtn} onPress={() => accept(item.id)}>
                <Text style={s.acceptText}>✓ Qabul qilish</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.rejectBtn} onPress={() => reject(item.id)}>
                <Text style={s.rejectText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", padding: 16 },
  title: { fontSize: 22, fontWeight: "900", color: "#1e293b", marginBottom: 16 },
  card: { backgroundColor: "#fff", borderRadius: 20, padding: 16, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  price: { fontSize: 22, fontWeight: "900", color: "#F46A0A" },
  timer: { backgroundColor: "#fef3c7", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  timerText: { fontSize: 13, color: "#d97706", fontWeight: "700" },
  route: { gap: 6, marginBottom: 10 },
  routeFrom: { fontSize: 14, color: "#374151", fontWeight: "500" },
  line: { height: 1, backgroundColor: "#f1f5f9", marginVertical: 2 },
  routeTo: { fontSize: 14, color: "#374151", fontWeight: "500" },
  distance: { fontSize: 12, color: "#94a3b8", marginBottom: 14 },
  actions: { flexDirection: "row", gap: 10 },
  acceptBtn: { flex: 1, backgroundColor: "#F46A0A", borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  acceptText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  rejectBtn: { width: 50, backgroundColor: "#f1f5f9", borderRadius: 14, alignItems: "center", justifyContent: "center" },
  rejectText: { color: "#64748b", fontSize: 18, fontWeight: "700" },
  empty: { alignItems: "center", paddingTop: 80 },
  emptyIcon: { fontSize: 60, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: "700", color: "#1e293b" },
  emptySub: { fontSize: 14, color: "#94a3b8", marginTop: 6 },
});
