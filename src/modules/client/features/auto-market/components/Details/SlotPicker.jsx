
import React from "react";
import { Tag } from "antd";

export default function SlotPicker({ slots = [], selectedSlot, onSelectSlot }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
      {slots.map((slot) => {
        const active = slot.key === selectedSlot;
        return (
          <button
            key={slot.key}
            type="button"
            onClick={() => onSelectSlot?.(slot.key)}
            style={{
              borderRadius: 18,
              padding: 14,
              border: active ? `1px solid ${slot.tone}` : "1px solid #e2e8f0",
              background: active ? `${slot.tone}14` : "#fff",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
              <div style={{ fontWeight: 900, color: "#0f172a" }}>{slot.label}</div>
              <Tag color="blue" style={{ borderRadius: 999, margin: 0 }}>{slot.modeLabel}</Tag>
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>{slot.note}</div>
            <div style={{ fontSize: 12, color: slot.tone, marginTop: 10, fontWeight: 800 }}>{slot.priceLabel}</div>
          </button>
        );
      })}
    </div>
  );
}
