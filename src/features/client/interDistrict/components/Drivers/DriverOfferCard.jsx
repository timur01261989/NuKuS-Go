import React from "react";
import { Card, Button, Typography, Tag } from "antd";
import { CarOutlined } from "@ant-design/icons";

/**
 * DriverOfferCard.jsx
 * -------------------------------------------------------
 * Bitta haydovchi taklifi.
 */
export default function DriverOfferCard({ offer, onSelect }) {
  return (
    <Card style={{ borderRadius: 18, marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
        <div style={{ display: "flex", gap: 10 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: "rgba(22,119,255,.10)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CarOutlined style={{ fontSize: 20, color: "#1677ff" }} />
          </div>

          <div>
            <Typography.Text style={{ fontWeight: 800, display: "block" }}>
              {offer.carModel} · {offer.carNumber}
            </Typography.Text>
            <Typography.Text style={{ color: "#666", fontSize: 12 }}>
              {offer.driverName} · Reyting {offer.rating.toFixed(1)}
            </Typography.Text>
            <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
              {offer.ac && <Tag color="blue" style={{ margin: 0 }}>AC</Tag>}
              {offer.trunk && <Tag color="purple" style={{ margin: 0 }}>Yukxona</Tag>}
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
