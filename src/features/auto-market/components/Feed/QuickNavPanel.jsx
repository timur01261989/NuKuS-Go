/**
 * QuickNavPanel.jsx
 * FeedPage'dagi tezkor navigatsiya paneli.
 * Yangi bo'limlarga (Vikup, Barter, Zapchast, Razborka, Battle va boshqalar) tezkor o'tish.
 */
import React from "react";
import { useNavigate } from "react-router-dom";

const SECTIONS = [
  { path:"/auto-market/vikup",        emoji:"💳", label:"Vikup",      bg:"linear-gradient(135deg,#fef9c3,#fefce8)", border:"#fde68a" },
  { path:"/auto-market/barter",       emoji:"🔄", label:"Barter",     bg:"linear-gradient(135deg,#dcfce7,#f0fdf4)", border:"#86efac" },
  { path:"/auto-market/zapchast",     emoji:"🔩", label:"Zapchast",   bg:"linear-gradient(135deg,#dbeafe,#eff6ff)", border:"#93c5fd" },
  { path:"/auto-market/razborka",     emoji:"🔧", label:"Razborka",   bg:"linear-gradient(135deg,#fee2e2,#fff1f2)", border:"#fca5a5" },
  { path:"/auto-market/garaj",        emoji:"🚗", label:"Garajim",    bg:"linear-gradient(135deg,#fae8ff,#fdf4ff)", border:"#d8b4fe" },
  { path:"/auto-market/battle",       emoji:"⚔️",  label:"Battle",     bg:"linear-gradient(135deg,#ede9fe,#f5f3ff)", border:"#c4b5fd" },
  { path:"/auto-market/analytics",    emoji:"📈", label:"Tahlil",     bg:"linear-gradient(135deg,#cffafe,#ecfeff)", border:"#67e8f9" },
  { path:"/auto-market/service-book", emoji:"📖", label:"Daftar",     bg:"linear-gradient(135deg,#e0f2fe,#f0f9ff)", border:"#7dd3fc" },
];

export default function QuickNavPanel() {
  const nav = useNavigate();
  return (
    <div style={{ padding:"10px 14px 0" }}>
      <div style={{ fontSize:13, fontWeight:900, color:"#0f172a", marginBottom:8 }}>Bo'limlar</div>
      <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:6 }}>
        {SECTIONS.map(s => (
          <div
            key={s.path}
            onClick={() => nav(s.path)}
            style={{
              flexShrink:0, cursor:"pointer",
              background: s.bg,
              border:`1.5px solid ${s.border}`,
              borderRadius:14, padding:"10px 12px",
              textAlign:"center", minWidth:66,
              boxShadow:"0 4px 12px rgba(0,0,0,0.04)",
              transition:"transform .15s",
            }}
          >
            <div style={{ fontSize:22, lineHeight:1 }}>{s.emoji}</div>
            <div style={{ fontSize:10, fontWeight:800, color:"#0f172a", marginTop:4, whiteSpace:"nowrap" }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
