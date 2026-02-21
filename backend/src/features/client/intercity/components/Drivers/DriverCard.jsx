import React from "react";
import { Card, Typography, Tag, Button } from "antd";
import { CarOutlined } from "@ant-design/icons";

const { Text, Title } = Typography;

export default function DriverCard({ offer, onSelect, selected }) {
  const price = offer?.price_sum ?? offer?.price ?? 0;

  return (
    <Card
      hoverable
      onClick={() => onSelect?.(offer)}
      style={{
        borderRadius: 18,
        border: selected ? "1px solid #1677ff" : "1px solid #eee",
        boxShadow: selected ? "0 10px 30px rgba(22,119,255,0.18)" : "0 10px 30px rgba(0,0,0,0.06)",
      }}
      bodyStyle={{ padding: 14 }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "grid", gap: 2 }}>
          <Title level={5} style={{ margin: 0, lineHeight: 1.1 }}>
            {offer?.driver_name || "Haydovchi"}
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            <CarOutlined /> {offer?.car_model || "Avtomobil"} • {offer?.car_plate || "—"}
          </Text>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
            {offer?.pickup_type && <Tag color="blue">{offer.pickup_type}</Tag>}
            {offer?.seats_left != null && <Tag color="green">{offer.seats_left} joy bor</Tag>}
            {offer?.rating && <Tag color="gold">★ {offer.rating}</Tag>}
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Narx
          </Text>
          <div style={{ fontSize: 18, fontWeight: 900 }}>{Number(price).toLocaleString("uz-UZ")} so'm</div>
          <Button type={selected ? "primary" : "default"} style={{ marginTop: 8, borderRadius: 12 }}>
            {selected ? "Tanlandi" : "Tanlash"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
