import React from "react";

/**
 * StatusBadge
 * status: "top" | "new" | "sold" | "credit" | "archived"
 *
 * - Ranglar bir xil bo'lib qolmasin deb, har bir status uchun alohida palitra.
 */
const STYLES = {
  top: { bg: "#7c3aed", fg: "#ffffff", label: "TOP" },         // purple
  new: { bg: "#16a34a", fg: "#ffffff", label: "Yangi" },       // green
  sold: { bg: "#ef4444", fg: "#ffffff", label: "Sotildi" },    // red
  credit: { bg: "#0ea5e9", fg: "#ffffff", label: "Kreditga" }, // sky
  archived: { bg: "#334155", fg: "#ffffff", label: "Arxiv" },  // slate
};

export default function StatusBadge({ status, text }) {
  if (!status && !text) return null;
  const key = (status || "").toLowerCase();
  const s = STYLES[key] || { bg: "#111827", fg: "#ffffff", label: status || "" };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 10px",
        borderRadius: 999,
        background: s.bg,
        color: s.fg,
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: 0.3,
        boxShadow: "0 10px 22px rgba(0,0,0,0.12)",
        lineHeight: 1,
        userSelect: "none",
        whiteSpace: "nowrap",
      }}
      title={text || s.label}
    >
      {text || s.label}
    </span>
  );
}
