import React from "react";
import { Card, Segmented, InputNumber } from "antd";

export default function HourlyRateSetup({ pricing, onChange }) {
  const type = pricing?.type || "hourly";
  return (
    <Card size="small" style={{ borderRadius: 16 }}>
      <div style={{ fontWeight: 800, marginBottom: 10 }}>Tarif</div>
      <Segmented
        value={type}
        onChange={(v) => onChange?.({ type: v })}
        options={[
          { label: "Soatiga", value: "hourly" },
          { label: "Reysiga", value: "trip" },
        ]}
      />
      <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ fontSize: 12, color: "#666", width: 90 }}>{type === "hourly" ? "Soat" : "Reys"} narxi</div>
        <InputNumber
          min={0}
          value={type === "hourly" ? pricing?.hourly : pricing?.trip}
          onChange={(v) => onChange?.(type === "hourly" ? { hourly: v } : { trip: v })}
          style={{ flex: 1 }}
          formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, " ")}
        />
        <div style={{ fontSize: 12, color: "#666" }}>so‘m</div>
      </div>
    </Card>
  );
}
