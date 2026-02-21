import React from "react";
import { Card } from "antd";
import { EnvironmentOutlined } from "@ant-design/icons";

export default function OrderInfoCard({ order }) {
  if (!order) return null;
  return (
    <Card style={{ borderRadius: 18, boxShadow: "0 10px 30px rgba(0,0,0,0.18)" }}>
      <div style={{ display: "grid", gap: 10 }}>
        <Line title="Olish" value={order.pickup_address || "-"} />
        <Line title="Borish" value={order.dropoff_address || "-"} />
      </div>
    </Card>
  );
}

function Line({ title, value }) {
  return (
    <div style={{ display: "flex", gap: 10 }}>
      <EnvironmentOutlined />
      <div>
        <div style={{ fontSize: 12, opacity: 0.7 }}>{title}</div>
        <div style={{ fontWeight: 800 }}>{value}</div>
      </div>
    </div>
  );
}
