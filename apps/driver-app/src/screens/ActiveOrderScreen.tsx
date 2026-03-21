import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Linking } from "react-native";

interface Props { order: any; onComplete: () => void; onCancel: () => void; }

export default function ActiveOrderScreen({ order, onComplete, onCancel }: Props) {
  const [status, setStatus] = useState(order?.status || "accepted");

  const callClient = () => Linking.openURL(`tel:${order?.client_phone}`);

  const nextStatus: Record<string, string> = {
    accepted:    "Mijoz oldiga ketdim",
    arrived:     "Mijozni oldim",
    in_progress: "Yetib keldim",
  };

  const nextAction: Record<string, string> = {
    accepted:    "arrived",
    arrived:     "in_progress",
    in_progress: "completed",
  };

  return (
    <View style={s.container}>
      <View style={s.card}>
        <Text style={s.label}>Holat</Text>
        <Text style={s.status}>{status.toUpperCase()}</Text>

        <View style={s.row}>
          <View style={s.point}>
            <Text style={s.pointLabel}>📍 Olish</Text>
            <Text style={s.address}>{order?.pickup_address || "Manzil aniqlanmoqda..."}</Text>
          </View>
          <View style={s.point}>
            <Text style={s.pointLabel}>🏁 Yetkazish</Text>
            <Text style={s.address}>{order?.dropoff_address || "Manzil aniqlanmoqda..."}</Text>
          </View>
        </View>

        <Text style={s.price}>{(order?.price_uzs || 0).toLocaleString("ru-RU")} so'm</Text>
      </View>

      <View style={s.actions}>
        {nextStatus[status] && (
          <TouchableOpacity style={s.btnPrimary} onPress={() => setStatus(nextAction[status])}>
            <Text style={s.btnText}>{nextStatus[status]}</Text>
          </TouchableOpacity>
        )}
        {status === "completed" && (
          <TouchableOpacity style={[s.btnPrimary, { backgroundColor: "#16a34a" }]} onPress={onComplete}>
            <Text style={s.btnText}>✓ Yakunlash</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={s.btnSecondary} onPress={callClient}>
          <Text style={[s.btnText, { color: "#374151" }]}>📞 Qo'ng'iroq</Text>
        </TouchableOpacity>
        {status === "accepted" && (
          <TouchableOpacity style={[s.btnSecondary, { borderColor: "#ef4444" }]} onPress={onCancel}>
            <Text style={[s.btnText, { color: "#ef4444" }]}>Bekor qilish</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", padding: 16 },
  card: { backgroundColor: "#fff", borderRadius: 24, padding: 20, marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  label: { fontSize: 12, color: "#94a3b8", fontWeight: "600", marginBottom: 4 },
  status: { fontSize: 20, fontWeight: "900", color: "#F46A0A", marginBottom: 16 },
  row: { gap: 12, marginBottom: 16 },
  point: { backgroundColor: "#f8fafc", borderRadius: 12, padding: 12 },
  pointLabel: { fontSize: 12, color: "#64748b", fontWeight: "700", marginBottom: 4 },
  address: { fontSize: 14, color: "#1e293b", fontWeight: "500" },
  price: { fontSize: 22, fontWeight: "900", color: "#1e293b", textAlign: "center" },
  actions: { gap: 10 },
  btnPrimary: { backgroundColor: "#F46A0A", borderRadius: 16, paddingVertical: 16, alignItems: "center" },
  btnSecondary: { backgroundColor: "#fff", borderRadius: 16, paddingVertical: 14, alignItems: "center", borderWidth: 1.5, borderColor: "#e2e8f0" },
  btnText: { fontSize: 16, fontWeight: "700", color: "#fff" },
});
