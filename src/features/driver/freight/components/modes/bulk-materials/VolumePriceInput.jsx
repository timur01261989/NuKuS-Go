import React from "react";
import { Card, Segmented, InputNumber } from "antd";

export default function VolumePriceInput({ volume, bulkPrice, onVolumeChange, onPriceChange }) {
  const unit = volume?.unit || "trip";
  return (
    <Card size="small" style={{ borderRadius: 16 }}>
      <div style={{ fontWeight: 800, marginBottom: 10 }}>Hajm va Narx</div>

      <Segmented
        value={unit}
        onChange={(v) => onVolumeChange?.({ unit: v })}
        options={[
          { label: "Borti (Reys)", value: "trip" },
          { label: "Tonna", value: "ton" },
        ]}
      />

      <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ fontSize: 12, color: "#666", width: 90 }}>Hajm</div>
        <InputNumber min={1} value={volume?.amount || 1} onChange={(v) => onVolumeChange?.({ amount: Number(v || 1) })} />
        <div style={{ fontSize: 12, color: "#666" }}>{unit === "ton" ? "tonna" : "reys"}</div>
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ fontSize: 12, color: "#666", width: 90 }}>{unit === "ton" ? "1 tonna" : "1 reys"} narxi</div>
        <InputNumber
          min={0}
          value={unit === "ton" ? bulkPrice?.perTon : bulkPrice?.perTrip}
          onChange={(v) => onPriceChange?.(unit === "ton" ? { perTon: Number(v || 0) } : { perTrip: Number(v || 0) })}
          style={{ flex: 1 }}
          formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, " ")}
        />
        <div style={{ fontSize: 12, color: "#666" }}>so‘m</div>
      </div>
    </Card>
  );
}
