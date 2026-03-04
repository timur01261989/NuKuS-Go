import React, { useMemo } from "react";
import { Card, Space, Tag, Typography, Button } from "antd";

/**
 * TripCard.jsx
 * -------------------------------------------------------
 * Topilgan reysni ko‘rsatadi.
 * Talab: haydovchi kiritgan barcha ma'lumotlar ko‘rinsin + "Buyirtma jonatish".
 */
const money = (n) => (n == null ? "" : new Intl.NumberFormat("uz-UZ").format(Number(n)));

export default function TripCard({ trip, onRequest }) {
  const priceLine = useMemo(() => {
    if (!trip) return "";
    if (trip.tariff === "pitak") return `${money(trip.base_price_uzs)} so‘m`;
    // door-to-door: base + pickup + dropoff (full salon alohida)
    const base = Number(trip.base_price_uzs || 0);
    const p = Number(trip.pickup_fee_uzs || 0);
    const d = Number(trip.dropoff_fee_uzs || 0);
    const sum = base + p + d;
    return `${money(sum)} so‘m (bazaviy)`;
  }, [trip]);

  return (
    <Card style={{ borderRadius: 18, marginBottom: 10 }} bodyStyle={{ padding: 14 }}>
      <Space style={{ width: "100%", justifyContent: "space-between" }} align="start">
        <div>
          <Typography.Text style={{ fontWeight: 800, fontSize: 15 }}>
            {trip.from_district} → {trip.to_district}
          </Typography.Text>
          <div style={{ marginTop: 6 }}>
            <Tag color={trip.tariff === "pitak" ? "blue" : "gold"}>
              {trip.tariff === "pitak" ? "Standart (Pitak)" : "Manzildan manzilga"}
            </Tag>
            {trip.has_ac && <Tag>❄️ Konditsioner</Tag>}
            {trip.has_trunk && <Tag>🧳 Yukxona</Tag>}
            {trip.is_lux && <Tag>✨ Luks</Tag>}
            {trip.allow_smoking && <Tag>🚬 Sigaret</Tag>}
            {trip.has_delivery && <Tag>📦 Eltish</Tag>}
          </div>

          {trip.tariff === "pitak" && trip.pitak_id && (
            <div style={{ marginTop: 6, color: "#555", fontSize: 12 }}>
              Pitak: <b>{trip.pitak_title || "Tanlangan pitak"}</b>
            </div>
          )}

          <div style={{ marginTop: 6, color: "#555", fontSize: 12 }}>
            Ketish: <b>{new Date(trip.depart_at).toLocaleString()}</b>
          </div>

          {trip.tariff === "door" && (
            <div style={{ marginTop: 6, color: "#555", fontSize: 12 }}>
              O‘rindiq: <b>{trip.seats_total || "—"}</b>{" "}
              {trip.allow_full_salon && trip.full_salon_price_uzs != null && (
                <>
                  · Butun salon: <b>{money(trip.full_salon_price_uzs)} so‘m</b>
                </>
              )}
            </div>
          )}

          <div style={{ marginTop: 8 }}>
            <Typography.Text style={{ fontWeight: 800 }}>{priceLine}</Typography.Text>
            {trip.tariff === "door" && (
              <div style={{ color: "#888", fontSize: 12, marginTop: 4 }}>
                Uyidan olib ketish: {money(trip.pickup_fee_uzs)} · Uyga olib borish: {money(trip.dropoff_fee_uzs)}
              </div>
            )}
            {trip.has_delivery && trip.delivery_price_uzs != null && (
              <div style={{ color: "#888", fontSize: 12, marginTop: 4 }}>
                Eltish narxi: {money(trip.delivery_price_uzs)} so‘m
              </div>
            )}
          </div>

          {trip.notes && (
            <div style={{ marginTop: 8, color: "#666", fontSize: 12 }}>
              Izoh: {trip.notes}
            </div>
          )}
        </div>

        <Button type="primary" onClick={() => onRequest?.(trip)} style={{ borderRadius: 14 }}>
          Buyirtma jonatish
        </Button>
      </Space>
    </Card>
  );
}
