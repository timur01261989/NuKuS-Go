import React from "react";

/**
 * status: top | new | sold | credit | archived
 */
const MAP = {
  top: { label: "TOP", bg: "#111827", fg: "#fbbf24" },
  new: { label: "Yangi", bg: "#e0f2fe", fg: "#0369a1" },
  sold: { label: "Sotildi", bg: "#fee2e2", fg: "#991b1b" },
  credit: { label: "Kreditga", bg: "#fef9c3", fg: "#854d0e" },
  archived: { label: "Arxiv", bg: "#f1f5f9", fg: "#334155" },
};

export default function StatusBadge({ status = "new" }) {
  const s = MAP[status] || MAP.new;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 900, background: s.bg, color: s.fg }}>
      {s.label}
    </span>
  );
}
