import React, { useMemo } from "react";
import { Card, Typography } from "antd";
import { useDistrict } from "../../context/DistrictContext";

/**
 * CarSeatSchema.jsx
 * -------------------------------------------------------
 * Mashina sxemasi: Old(1), Orqa(3).
 * Tanlangan o‘rindiqlar seatState.selected Set ichida saqlanadi.
 */
const SEATS = [
  { id: "F1", label: "Old 1" },
  { id: "B1", label: "Orqa 1" },
  { id: "B2", label: "Orqa 2" },
  { id: "B3", label: "Orqa 3" },
];

export default function CarSeatSchema() {
  const { seatState, setSeatState } = useDistrict();

  const selected = seatState.selected;

  const toggle = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSeatState({ selected: next });
  };

  const selectedCount = useMemo(() => selected.size, [selected]);

  return (
    <Card style={{ borderRadius: 18 }}>
      <Typography.Text style={{ fontWeight: 700 }}>O‘rindiq tanlash</Typography.Text>
      <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
        {SEATS.map((s) => {
          const isOn = selected.has(s.id);
          return (
            <button
              key={s.id}
              onClick={() => toggle(s.id)}
              style={{
                border: "1px solid rgba(0,0,0,.12)",
                borderRadius: 14,
                padding: "12px 10px",
                fontWeight: 800,
                background: isOn ? "rgba(82,196,26,.18)" : "#fff",
                cursor: "pointer",
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>
      <div style={{ marginTop: 10, color: "#666", fontSize: 12 }}>
        Tanlandi: <b>{selectedCount}</b> ta
      </div>
    </Card>
  );
}
