
import React from "react";

export default function SpecsTable({ ad }) {
  const rows = [
    ["Shahar", ad?.city],
    ["Yil", ad?.year],
    ["Yurgan", ad?.mileage],
    ["Yoqilg'i", ad?.fuel],
    ["KPP", ad?.transmission],
    ["Rang", ad?.color],
  ].filter(([,v]) => v !== undefined && v !== null && v !== "");

  if (!rows.length) return null;

  return (
    <div style={{ padding: 12 }}>
      <div style={{ fontWeight: 900, marginBottom: 8 }}>Xususiyatlar</div>
      <div style={{ background: "white", border: "1px solid #f0f0f0", borderRadius: 16, overflow: "hidden" }}>
        {rows.map(([k,v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", borderTop: "1px solid #f5f5f5" }}>
            <div style={{ color: "#777" }}>{k}</div>
            <div style={{ fontWeight: 800 }}>{String(v)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
