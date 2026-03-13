import React from "react";
import { Card, Slider, Tag } from "antd";

/**
 * Do-zagrus (Partial load) vizual.
 * 100% bo'lsa - yangi yuk qabul qilmaydi.
 */
export default function TruckLoadVisual({ fillPct, onChange }) {
  const pct = Number(fillPct || 0);

  return (
    <Card size="small" style={{ borderRadius: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div style={{ fontWeight: 800 }}>Kuzov to'lishi (Do-zagrus)</div>
        <Tag color={pct >= 100 ? "red" : pct >= 60 ? "gold" : "green"} style={{ margin: 0 }}>
          {pct}% 
        </Tag>
      </div>

      <div style={{ marginTop: 12 }}>
        <Slider
          min={0}
          max={100}
          value={pct}
          onChange={(v) => onChange?.(v)}
          tooltip={{ formatter: (v) => `${v}%` }}
        />
      </div>

      <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
        100% bo‘lsa — yangi yuk qabul qilinmaydi. 50% bo‘lsa — kichik yuklar taklif qilinadi.
      </div>

      <div style={{ marginTop: 12, borderRadius: 12, background: "#f5f5f5", padding: 10 }}>
        <div style={{ height: 14, borderRadius: 10, background: "#e9e9e9", overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", borderRadius: 10, background: "#52c41a" }} />
        </div>
      </div>
    </Card>
  );
}
