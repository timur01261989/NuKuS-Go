import React from "react";
import { Card } from "antd";

const CHIPS = [
  { id: "document", label: "Hujjat", emoji: "📄" },
  { id: "keys", label: "Kalit", emoji: "🔑" },
  { id: "box_small", label: "Kichik quti", emoji: "📦" },
  { id: "box_large", label: "Katta quti", emoji: "🧰" },
  { id: "flowers", label: "Gul", emoji: "💐" },
];

export default function ParcelTypeChips({ value, onChange }) {
  return (
    <Card style={{ borderRadius: 18 }} bodyStyle={{ padding: 14 }}>
      <div style={{ fontWeight: 1000, marginBottom: 10 }}>Yuk turi</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {CHIPS.map((c) => {
          const active = value === c.id;
          return (
            <button
              key={c.id}
              onClick={() => onChange?.(c.id)}
              style={{
                borderRadius: 16,
                border: active ? "2px solid #1677ff" : "1px solid rgba(0,0,0,.1)",
                background: active ? "rgba(22,119,255,.08)" : "#fff",
                padding: "12px 10px",
                cursor: "pointer",
              }}
              type="button"
            >
              <div style={{ fontSize: 22 }}>{c.emoji}</div>
              <div style={{ fontWeight: 900, fontSize: 12, marginTop: 6 }}>{c.label}</div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
