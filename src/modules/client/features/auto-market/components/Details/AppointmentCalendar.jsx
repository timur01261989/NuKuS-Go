
import React from "react";
import { Tag } from "antd";

export default function AppointmentCalendar({ days = [], selectedDay, onSelectDay }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10 }}>
      {days.map((day) => {
        const active = day.key === selectedDay;
        return (
          <button
            key={day.key}
            type="button"
            onClick={() => onSelectDay?.(day.key)}
            style={{
              borderRadius: 18,
              padding: 14,
              border: active ? "1px solid #0f172a" : "1px solid #e2e8f0",
              background: active ? "#0f172a" : "#fff",
              color: active ? "#fff" : "#0f172a",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            <div style={{ fontWeight: 900 }}>{day.label}</div>
            <div style={{ fontSize: 12, opacity: active ? 0.86 : 0.7, marginTop: 6 }}>{day.text}</div>
            {day.slots > 0 ? (
              <Tag color={active ? "blue" : "default"} style={{ marginTop: 10, borderRadius: 999 }}>
                {day.slots} ta slot
              </Tag>
            ) : (
              <Tag color="default" style={{ marginTop: 10, borderRadius: 999 }}>Slot tugagan</Tag>
            )}
          </button>
        );
      })}
    </div>
  );
}
