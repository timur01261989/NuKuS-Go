import React from "react";
import { Card } from "antd";
import { SafetyOutlined } from "@ant-design/icons";

export default function SafetyTipsCard() {
  const tips = [
    "Oldindan pul jo'natmang (avans).",
    "Hujjatlarni tekshiring (PTS, ishonchnoma).",
    "Uchrashuvni gavjum joyda belgilang.",
    "Mashina raqami va VIN mosligini tekshiring.",
  ];

  return (
    <Card style={{ borderRadius: 18, border: "1px solid #ffe4c7", background: "#fff7ed" }} bodyStyle={{ padding: 14 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{
          width: 40, height: 40, borderRadius: 16,
          background: "linear-gradient(135deg,#fb7185,#f97316)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff"
        }}>
          <SafetyOutlined />
        </div>
        <div style={{ fontWeight: 900, color: "#7c2d12" }}>Xavfsizlik tavsiyalari</div>
      </div>
      <ul style={{ marginTop: 10, paddingLeft: 18, color: "#9a3412" }}>
        {tips.map((t, i) => <li key={i} style={{ marginBottom: 6 }}>{t}</li>)}
      </ul>
    </Card>
  );
}
