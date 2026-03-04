import React, { useMemo } from "react";
import { Card, Typography, Switch, Space } from "antd";
import { useDistrict } from "../../context/DistrictContext";

/**
 * CarSeatSchema.jsx (Client)
 * -------------------------------------------------------
 * O‘rindiq tanlash:
 * - door-to-door rejimida "Butun salon" (full salon) tanlash mumkin.
 * - Agar full salon tanlansa, o‘rindiqlar avtomatik (hammasi) deb hisoblanadi.
 */
const SEATS = [
  { id: "F1", label: "Old 1" },
  { id: "B1", label: "Orqa 1" },
  { id: "B2", label: "Orqa 2" },
  { id: "B3", label: "Orqa 3" },
];

export default function CarSeatSchema() {
  const { seatState, setSeatState, doorToDoor } = useDistrict();

  const selected = seatState.selected;
  const wantsFullSalon = !!seatState.wantsFullSalon;

  const toggleSeat = (id) => {
    if (wantsFullSalon) return;
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSeatState({ ...seatState, selected: next });
  };

  const selectedCount = useMemo(() => (wantsFullSalon ? SEATS.length : selected.size || 0), [selected, wantsFullSalon]);

  return (
    <Card style={{ borderRadius: 18 }}>
      <Space style={{ width: "100%", justifyContent: "space-between" }} align="center">
        <Typography.Text style={{ fontWeight: 700 }}>O‘rindiq tanlash</Typography.Text>
        {doorToDoor && (
          <Space size={8} align="center">
            <Typography.Text style={{ fontSize: 12, opacity: 0.7 }}>Butun salon</Typography.Text>
            <Switch
              checked={wantsFullSalon}
              onChange={(v) => {
                const nextSelected = v ? new Set(SEATS.map((s) => s.id)) : new Set();
                setSeatState({ ...seatState, wantsFullSalon: v, selected: nextSelected });
              }}
            />
          </Space>
        )}
      </Space>

      <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, opacity: wantsFullSalon ? 0.6 : 1 }}>
        {SEATS.map((s) => {
          const isOn = selected.has(s.id) || wantsFullSalon;
          return (
            <button
              key={s.id}
              onClick={() => toggleSeat(s.id)}
              style={{
                border: "1px solid rgba(0,0,0,.12)",
                borderRadius: 14,
                padding: "12px 10px",
                fontWeight: 800,
                background: isOn ? "rgba(82,196,26,.18)" : "#fff",
                cursor: wantsFullSalon ? "not-allowed" : "pointer",
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
