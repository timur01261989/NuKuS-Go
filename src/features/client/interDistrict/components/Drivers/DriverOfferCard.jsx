import React from "react";
import { Card, Button, Typography, Tag } from "antd";
import { CarOutlined } from "@ant-design/icons";

/**
 * DriverOfferCard.jsx
 * -------------------------------------------------------
 * Bitta haydovchi taklifi.
 * * "YAGONA REYS" QO'SHIMCHALARI:
 * - Pochta (Posilka) qabul qilish belgisi qo'shildi.
 * - Ayollar uchun maxsus reys (Gender filtri) belgisi qo'shildi.
 */
export default function DriverOfferCard({ offer, onSelect }) {
  return (
    <Card style={{ borderRadius: 18, marginBottom: 10 }}>
      {/* Kichik ekranlarda tugma va ma'lumotlar siqilib ketmasligi uchun alignItems qo'shildi */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
        <div style={{ display: "flex", gap: 10, flex: 1 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: "rgba(22,119,255,.10)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0 // Ikonka kichrayib ketmasligi uchun
            }}
          >
            <CarOutlined style={{ fontSize: 20, color: "#1677ff" }} />
          </div>

          <div>
            <Typography.Text style={{ fontWeight: 800, display: "block" }}>
              {offer.carModel} · {offer.carNumber}
            </Typography.Text>
            <Typography.Text style={{ color: "#666", fontSize: 12 }}>
              {offer.driverName} · Reyting {offer.rating ? offer.rating.toFixed(1) : "5.0"}
            </Typography.Text>
            <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
              {/* Eski kod teglari (O'zgarishsiz qoldi) */}
              {offer.ac && <Tag color="blue" style={{ margin: 0 }}>AC</Tag>}
              {offer.trunk && <Tag color="purple" style={{ margin: 0 }}>Yukxona</Tag>}
              
              {/* YANGI QO'SHILGAN TEGLAR ("Yagona Reys" tizimi uchun) */}
              {(offer.has_delivery || offer.hasDelivery) && (
                <Tag color="green" style={{ margin: 0 }}>📦 Pochta</Tag>
              )}
              {(offer.female_only || offer.femaleOnly) && (
                <Tag color="magenta" style={{ margin: 0 }}>👩 Ayollar</Tag>
              )}

              <Tag color="green" style={{ margin: 0 }}>{offer.price.toLocaleString("ru-RU")} so'm</Tag>
            </div>
          </div>
        </div>

        <Button type="primary" onClick={() => onSelect?.(offer)} style={{ borderRadius: 14, height: 40 }}>
          Tanlash
        </Button>
      </div>
    </Card>
  );
}