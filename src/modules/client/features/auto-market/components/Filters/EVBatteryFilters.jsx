import React from "react";
import { Switch } from "antd";

export default function EVBatteryFilters({ values = {}, onChange }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
      <div style={{ padding: 12, borderRadius: 16, border: "1px solid #e2e8f0", background: "#f8fafc" }}>
        <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>EV / gibrid holati</div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Faqat elektromobil</span>
          <Switch checked={!!values.electricOnly} onChange={(checked) => onChange?.({ electricOnly: checked, fuel_type: checked ? "Elektro" : values.fuel_type })} />
        </div>
      </div>
      <div style={{ padding: 12, borderRadius: 16, border: "1px solid #e2e8f0", background: "#f8fafc" }}>
        <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>Batareya afzalligi</div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Batareya kafolati</span>
          <Switch checked={!!values.batteryWarranty} onChange={(checked) => onChange?.({ batteryWarranty: checked })} />
        </div>
      </div>
    </div>
  );
}