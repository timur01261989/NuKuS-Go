import React from "react";
import { Card, Tag, Typography } from "antd";
const { Text } = Typography;

export default function TruckCard({ truck, selected, onClick }) {
  return (
    <Card hoverable onClick={onClick} style={{ borderRadius: 18, border: selected ? "2px solid #1677ff" : "1px solid rgba(0,0,0,.08)" }} bodyStyle={{ padding: 14 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ width: 54, height: 54, borderRadius: 16, background: "rgba(22,119,255,.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }} aria-hidden>
          {truck.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <div style={{ fontWeight: 900, fontSize: 14 }}>{truck.title}</div>
            <Tag color={selected ? "blue" : "default"} style={{ margin: 0 }}>{truck.sizeLabel}</Tag>
          </div>
          <Text type="secondary" style={{ fontSize: 12 }}>{truck.subtitle}</Text>
          <div style={{ marginTop: 6, fontSize: 12 }}>
            <Text strong>Sig‘im:</Text> <Text type="secondary">{truck.capacity}</Text>
          </div>
        </div>
      </div>
    </Card>
  );
}
