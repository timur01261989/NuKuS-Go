import React from "react";

/**
 * StatusBadge
 * status: "top" | "new" | "sold" | "credit" | "archived" | "vikup" | "barter"
 *
 * - Ranglar bir xil bo'lib qolmasin deb, har bir status uchun alohida palitra.
 * YANGI: vikup (sariq-to'q) va barter (yashil-to'q) qo'shildi
 */
const STYLES = {
  top:      { bg: "#7c3aed", fg: "#ffffff", label: "TOP" },         // purple
  new:      { bg: "#16a34a", fg: "#ffffff", label: "Yangi" },       // green
  sold:     { bg: "#ef4444", fg: "#ffffff", label: "Sotildi" },     // red
  credit:   { bg: "#0ea5e9", fg: "#ffffff", label: "Kreditga" },    // sky
  archived: { bg: "#334155", fg: "#ffffff", label: "Arxiv" },       // slate
  // YANGI
  vikup:    { bg: "#d97706", fg: "#ffffff", label: "Vikup" },       // amber
  barter:   { bg: "#059669", fg: "#ffffff", label: "Barter" },      // emerald
};

export default function StatusBadge({ status, text, type }) {
  // type prop ham qabul qilinadi (CarCardVertical da type="CREDIT" ishlatilgan)
  const raw = type || status || "";
  if (!raw && !text) return null;
  const key = raw.toLowerCase().replace(/^credit$/, "credit").replace(/^exchange$/, "barter");
  const s = STYLES[key] || { bg: "#111827", fg: "#ffffff", label: raw };

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
