import React, { useMemo } from "react";
import { useClientText } from "../../shared/i18n_clientLocalize";
import { Card, Space, Tag, Typography, Button, Divider } from "antd";

/**
 * TripCard.jsx
 * -------------------------------------------------------
 * Topilgan reysni ko‘rsatadi.
 * Talab: haydovchi kiritgan barcha ma'lumotlar ko‘rinsin + cp("Buyirtma jonatish").
 * * "YAGONA REYS" TIZIMI QO'SHIMCHALARI:
 * - Pochta qabul qilinishi (ajratib ko'rsatildi)
 * - Ayollar uchun maxsus reys (Gender filtri belgisi)
 * - Haydovchi reytingi va Mashina rusumi (agar bazadan kelsa)
 * - Narxni to'g'ri va yirik ko'rsatish
 */
const money = (n) => (n == null ? "" : new Intl.NumberFormat("uz-UZ").format(Number(n)));

export default function TripCard({ trip, onRequest }) {
  const { cp } = useClientText();
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
    <Card style={{ borderRadius: 18, marginBottom: 12, border: "1px solid #e8e8e8" }} bodyStyle={{ padding: 16 }}>
      <Space style={{ width: "100%", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <Typography.Text style={{ fontWeight: 800, fontSize: 16, color: "#333" }}>
            {trip.from_district} → {trip.to_district}
          </Typography.Text>
          
          {/* YANGI: Haydovchi va Mashina ma'lumotlari (Agar API'dan kelsa) */}
          <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: 13, color: "#555", fontWeight: 600 }}>
              {trip.car_model || cp("Avtomobil nomi yo'q")} 
            </span>
            <span style={{ fontSize: 13, color: "#888" }}>•</span>
            <span style={{ fontSize: 13, color: "#fa8c16", fontWeight: 600 }}>
              ★ {trip.driver_rating || "5.0"}
            </span>
          </div>

          <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: "6px" }}>
            <Tag color={trip.tariff === "pitak" ? "blue" : "gold"} style={{ border: 0, fontWeight: 600 }}>
              {trip.tariff === "pitak" ? cp("Standart (Pitak)") : cp("Manzildan manzilga")}
            </Tag>
            
            {/* Eski filtrlar */}
            {trip.has_ac && <Tag style={{ border: 0 }}>❄️ Konditsioner</Tag>}
            {trip.has_trunk && <Tag style={{ border: 0 }}>🧳 Yukxona</Tag>}
            {trip.is_lux && <Tag style={{ border: 0 }}>✨ Luks</Tag>}
            {trip.allow_smoking && <Tag style={{ border: 0 }}>🚬 Sigaret</Tag>}
            
            {/* YANGI: Pochta belgisi aniqroq ko'rinishi uchun yashil rangda */}
            {trip.has_delivery && <Tag color="green" style={{ border: 0 }}>📦 Pochta oladi</Tag>}

            {/* YANGI: Ayollar uchun maxsus reys belgisi */}
            {trip.female_only && <Tag color="magenta" style={{ border: 0 }}>👩 Faqat ayollar</Tag>}
          </div>

          {trip.tariff === "pitak" && trip.pitak_id && (
            <div style={{ marginTop: 8, color: "#555", fontSize: 13 }}>
              {cp("Stoyanka (Pitak):") || "Stoyanka (Pitak):"} <b style={{ color: "#333" }}>{trip.pitak_title || cp("Tanlangan pitak")}</b>
            </div>
          )}

          <div style={{ marginTop: 6, color: "#555", fontSize: 13 }}>
            Ketish vaqti: <b style={{ color: "#1677ff" }}>{new Date(trip.depart_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</b>
          </div>

          {trip.tariff === "door" && (
            <div style={{ marginTop: 6, color: "#555", fontSize: 13 }}>
              Bo'sh o‘rindiqlar: <b style={{ color: "#333", fontSize: 14 }}>{trip.seats_total || "—"} ta</b>{" "}
              {trip.allow_full_salon && trip.full_salon_price_uzs != null && (
                <>
                  <br />Butun salon: <b style={{ color: "#52c41a" }}>{money(trip.full_salon_price_uzs)} so‘m</b>
                </>
              )}
            </div>
          )}

          <Divider style={{ margin: "10px 0" }} />

          <div>
            {/* YANGI: Asosiy narx yiriklashtirildi */}
            <Typography.Text style={{ fontWeight: 800, fontSize: 18, color: "#fa8c16" }}>
              {priceLine}
            </Typography.Text>
            
            {trip.tariff === "door" && (
              <div style={{ color: "#888", fontSize: 12, marginTop: 4 }}>
                Uydan olish: {money(trip.pickup_fee_uzs)} so'm · Uyga borish: {money(trip.dropoff_fee_uzs)} so'm
              </div>
            )}
            
            {/* Pochta narxini ko'rsatish */}
            {trip.has_delivery && trip.delivery_price_uzs != null && (
              <div style={{ color: "#1677ff", fontSize: 12, marginTop: 4, fontWeight: 500 }}>
                Minimal eltish narxi: {money(trip.delivery_price_uzs)} so‘m
              </div>
            )}
          </div>

          {trip.notes && (
            <div style={{ marginTop: 10, padding: "8px 12px", background: "#f9f9f9", borderRadius: 8, color: "#666", fontSize: 12, fontStyle: "italic" }}>
              " {trip.notes} "
            </div>
          )}
        </div>
      </Space>

      {/* Tugma pastga, to'liq kenglikka (width: 100%) olindi, shunda bosishga qulayroq bo'ladi */}
      <Button 
        type="primary" 
        onClick={() => onRequest?.(trip)} 
        style={{ width: "100%", marginTop: 16, borderRadius: 12, height: 40, fontWeight: 600 }}
      >
        Buyurtma berish
      </Button>
    </Card>
  );
}