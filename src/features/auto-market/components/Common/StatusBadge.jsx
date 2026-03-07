import React from "react";
import { useAutoMarketI18n } from "../../utils/useAutoMarketI18n";

const STYLES = {
  top:      { bg: "#7c3aed", fg: "#ffffff", label: "TOP" },
  new:      { bg: "#16a34a", fg: "#ffffff", label: "status.new" },
  sold:     { bg: "#ef4444", fg: "#ffffff", label: "status.sold" },
  credit:   { bg: "#0ea5e9", fg: "#ffffff", label: "status.credit" },
  archived: { bg: "#334155", fg: "#ffffff", label: "status.archived" },
  vikup:    { bg: "#d97706", fg: "#ffffff", label: "status.vikup" },
  barter:   { bg: "#059669", fg: "#ffffff", label: "status.barter" },
};

export default function StatusBadge({ status, text, type }) {
  const { am } = useAutoMarketI18n();
  const raw = type || status || "";
  if (!raw && !text) return null;
  const key = String(raw).toLowerCase().replace(/^credit$/, "credit").replace(/^exchange$/, "barter");
  const s = STYLES[key] || { bg: "#111827", fg: "#ffffff", label: raw };
  const label = text || (String(s.label).startsWith("status.") ? am(s.label) : s.label);
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:6,padding:"6px 10px",borderRadius:999,background:s.bg,color:s.fg,fontSize:12,fontWeight:800,letterSpacing:0.3,boxShadow:"0 10px 22px rgba(0,0,0,0.12)",lineHeight:1,userSelect:"none",whiteSpace:"nowrap"}} title={label}>
      {label}
    </span>
  );
}
