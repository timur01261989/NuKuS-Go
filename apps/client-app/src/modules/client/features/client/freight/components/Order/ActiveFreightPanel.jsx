import React from "react";
import { useClientText } from "../../../shared/i18n_clientLocalize";
import { Button, Card, Typography } from "antd";
import { LoadingOutlined, StopOutlined } from "@ant-design/icons";
import { useFreight } from "../../context/FreightContext";
const { Text } = Typography;

export default function ActiveFreightPanel({
 mode, onCancel }) {
  const { truck, pickup, dropoff } = useFreight();
  if (!mode) return null;

  return (
    <Card style={{ borderRadius: 18, background: "rgba(255,255,255,.95)" }} styles={{ body: { padding: 14 } }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 1000, fontSize: 14 }}>{mode === "searching" ? cp("Haydovchi qidirilmoqda...") : cp("Haydovchi kelmoqda...")}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>{truck?.title} • {pickup?.address || "Yuklash"} → {dropoff?.address || "Tushirish"}</Text>
        </div>
        <div style={{ fontSize: 20 }}><LoadingOutlined spin /></div>
      </div>
      <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
        <Button danger icon={<StopOutlined />} onClick={onCancel} style={{ borderRadius: 14, flex: 1 }}>Bekor qilish</Button>
        <Button disabled style={{ borderRadius: 14, flex: 1 }}>Tafsilotlar (keyin)</Button>
      </div>
    </Card>
  );
}