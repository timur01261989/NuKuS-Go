import React from "react";
import { Card } from "antd";
import { DashboardOutlined, CalendarOutlined, SettingOutlined, ThunderboltOutlined } from "@ant-design/icons";

function Spec({ icon, label, value }) {
  return (
    <div style={{
      padding: 12,
      borderRadius: 16,
      background: "linear-gradient(135deg, rgba(14,165,233,.10), rgba(34,197,94,.08))",
      border: "1px solid rgba(148,163,184,.35)"
    }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{
          width: 34, height: 34, borderRadius: 12,
          background: "rgba(15,23,42,.06)",
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>{label}</div>
          <div style={{ fontSize: 13, fontWeight: 900, color: "#0f172a", marginTop: 2 }}>{value || "-"}</div>
        </div>
      </div>
    </div>
  );
}

export default function MainSpecsGrid({ car }) {
  return (
    <Card
      style={{ borderRadius: 18, border: "1px solid #e2e8f0" }}
      bodyStyle={{ padding: 14 }}
      title={<div style={{ fontWeight: 900, color: "#0f172a" }}>Asosiy parametrlar</div>}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Spec icon={<CalendarOutlined />} label="Yil" value={car?.year} />
        <Spec icon={<DashboardOutlined />} label="Probeg" value={(car?.mileage ?? "-") + " km"} />
        <Spec icon={<ThunderboltOutlined />} label="Motor" value={car?.engine} />
        <Spec icon={<SettingOutlined />} label="Uzatma" value={car?.transmission} />
      </div>
    </Card>
  );
}
