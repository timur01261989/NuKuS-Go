
import React from "react";

const items = [
  { key: "cars", label: "Avto", emoji: "🚗" },
  { key: "parts", label: "Zapchast", emoji: "🧰" },
  { key: "services", label: "Servis", emoji: "🛠️" },
  { key: "rent", label: "Ijaraga", emoji: "📄" },
];

export default function CategoriesRow({ onSelect }) {
  return (
    <div style={{ display: "flex", gap: 10, padding: "0 12px 12px", overflowX: "auto" }}>
      {items.map((c) => (
        <button
          key={c.key}
          onClick={() => onSelect?.(c.key)}
          style={{
            border: "1px solid #eee",
            background: "white",
            borderRadius: 16,
            padding: "10px 14px",
            minWidth: 110,
            display: "flex",
            alignItems: "center",
            gap: 8,
            boxShadow: "0 4px 16px rgba(0,0,0,0.04)"
          }}
        >
          <span style={{ fontSize: 20 }}>{c.emoji}</span>
          <span style={{ fontWeight: 600 }}>{c.label}</span>
        </button>
      ))}
    </div>
  );
}
