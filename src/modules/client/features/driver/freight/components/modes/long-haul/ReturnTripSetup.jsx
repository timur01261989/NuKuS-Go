import React from "react";
import { Card, Switch } from "antd";

export default function ReturnTripSetup({ enabled, onChange }) {
  return (
    <Card size="small" style={{ borderRadius: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <div style={{ fontWeight: 800 }}>Ortga bo‘sh qaytmaslik</div>
          <div style={{ fontSize: 12, color: "#666" }}>Qaytishda poputchik yuklarni ham ko‘rsatadi</div>
        </div>
        <Switch checked={!!enabled} onChange={(v) => onChange?.(v)} />
      </div>
    </Card>
  );
}
