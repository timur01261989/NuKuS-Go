import React from "react";
import { Card, Descriptions, Tag } from "antd";

export default function VehiclePassport({ vehicle }) {
  if (!vehicle) return null;
  return (
    <Card size="small" style={{ borderRadius: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div style={{ fontWeight: 800 }}>{vehicle.title}</div>
        <Tag color="blue" style={{ margin: 0 }}>{vehicle.kind?.toUpperCase()}</Tag>
      </div>
      <Descriptions size="small" column={2} style={{ marginTop: 10 }}>
        <Descriptions.Item label="Sig'im (t)">{vehicle.capacityTons ?? "-"}</Descriptions.Item>
        <Descriptions.Item label="Kuzov (m)">{vehicle.bodyMeters ?? "-"}</Descriptions.Item>
        <Descriptions.Item label="Tent">{vehicle.tent ? "Ha" : "Yo'q"}</Descriptions.Item>
        <Descriptions.Item label="Ochiq">{vehicle.openBody ? "Ha" : "Yo'q"}</Descriptions.Item>
      </Descriptions>
    </Card>
  );
}
