import React from "react";
import { Card, Row, Col } from "antd";

const MATERIALS = [
  { type: "sand", label: "Qum", emoji: "🏜️", variants: ["Sariq", "Qora"] },
  { type: "gravel", label: "Shag'al", emoji: "🪨", variants: ["Mayda", "Yirik"] },
  { type: "brick", label: "G'isht/Blok", emoji: "🧱", variants: ["G'isht", "Shlakoblok"] },
  { type: "soil", label: "Tuproq/Go'ng", emoji: "🌱", variants: ["Tuproq", "Go'ng"] },
];

export default function MaterialSelector({ material, onChange }) {
  const current = material?.type;

  return (
    <Card size="small" style={{ borderRadius: 16 }}>
      <div style={{ fontWeight: 800, marginBottom: 10 }}>Material tanlang</div>
      <Row gutter={[10, 10]}>
        {MATERIALS.map((m) => (
          <Col span={12} key={m.type}>
            <div
              role="button"
              tabIndex={0}
              onClick={() => onChange?.({ type: m.type, variant: m.variants?.[0] || null })}
              onKeyDown={(e) => e.key === "Enter" && onChange?.({ type: m.type, variant: m.variants?.[0] || null })}
              style={{
                borderRadius: 16,
                border: current === m.type ? "2px solid #faad14" : "1px solid #eee",
                padding: 12,
                background: current === m.type ? "#fff7e6" : "#fff",
                cursor: "pointer",
              }}
            >
              <div style={{ fontSize: 22 }}>{m.emoji}</div>
              <div style={{ fontWeight: 800, marginTop: 4 }}>{m.label}</div>
              <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{(m.variants || []).join(" / ")}</div>
            </div>
          </Col>
        ))}
      </Row>

      {current ? (
        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
          {MATERIALS.find((x) => x.type === current)?.variants?.map((v) => (
            <div
              key={v}
              role="button"
              tabIndex={0}
              onClick={() => onChange?.({ type: current, variant: v })}
              onKeyDown={(e) => e.key === "Enter" && onChange?.({ type: current, variant: v })}
              style={{
                padding: "6px 10px",
                borderRadius: 12,
                border: material?.variant === v ? "1px solid #faad14" : "1px solid #ddd",
                background: material?.variant === v ? "#fff7e6" : "#fff",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              {v}
            </div>
          ))}
        </div>
      ) : null}
    </Card>
  );
}
