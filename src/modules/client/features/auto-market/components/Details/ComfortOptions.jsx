import React from "react";
import { Card, Tag } from "antd";

export default function ComfortOptions({ comfort }) {
  const c = comfort || {};
  const items = [
    { key: "ac", label: "Konditsioner" },
    { key: "abs", label: "ABS" },
    { key: "sunroof", label: "Lyuk" },
    { key: "airbags", label: "Airbag" },
  ];

  return (
    <Card style={{ borderRadius: 18, border: "1px solid #e2e8f0" }} styles={{ body: { padding: 14 } }}
      title={<div style={{ fontWeight: 900, color: "#0f172a" }}>Komfort</div>}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {items.map(it => (
          <Tag key={it.key} color={c[it.key] ? "green" : "default"} style={{ borderRadius: 999, padding: "4px 10px" }}>
            {it.label}: {c[it.key] ? "bor" : "yo'q"}
          </Tag>
        ))}
      </div>
    </Card>
  );
}
