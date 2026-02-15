import React from "react";
import { Avatar, Card, Typography } from "antd";
import { UserOutlined } from "@ant-design/icons";
const { Text } = Typography;

export default function CourierInfoCard({ courier }) {
  if (!courier) return null;
  return (
    <Card style={{ borderRadius: 18 }} bodyStyle={{ padding: 14 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <Avatar size={48} src={courier.avatar} icon={<UserOutlined />} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 1000 }}>{courier.name || "Kuryer"}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {courier.vehicle || "Transport"} • {courier.phone || ""}
          </Text>
        </div>
        <div style={{ fontWeight: 900, fontSize: 12, opacity: 0.7 }}>
          Reyting: {courier.rating || "—"}
        </div>
      </div>
    </Card>
  );
}
