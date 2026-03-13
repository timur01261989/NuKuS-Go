/**
 * SponsoredCarCard.jsx
 * {am("sponsor.ad")} kartochkasi — lentada har 5 ta kartadan keyin chiqadi.
 * "Native" integratsiya: oddiy kartochkaga o'xshaydi, lekin "{am("sponsor.ad")}" belgisi bor.
 *
 * Props:
 *  - sponsor: { brand, title, subtitle, cta, color, bg, logo_text, onClick }
 *
 * Standart sponsor ro'yxati (FeedPage da ishlatiladi).
 */
import React from "react";
import { Tag } from "antd";
import { StarFilled, RightOutlined } from "@ant-design/icons";
import { useAutoMarketI18n } from "../../utils/useAutoMarketI18n";

export const DEFAULT_SPONSORS = [
  {
    id: "byd_nukus",
    brand: "BYD",
    title: "BYD Nukus — Rasmiy Diler",
    subtitle: "Yangi BYD Seal, Atto 3. Test-drayvga yozing!",
    cta: "Batafsil →",
    color: "#1d4ed8",
    bg: "linear-gradient(135deg,#dbeafe,#eff6ff)",
    logo_text: "BYD",
    phone: "+998901234567",
  },
  {
    id: "kia_nukus",
    brand: "KIA",
    title: "KIA Markaz Nukus",
    subtitle: "KIA K5, Sportage — 0% foizsiz kredit, 48 oy!",
    cta: "Murojaat qiling →",
    color: "#7c3aed",
    bg: "linear-gradient(135deg,#ede9fe,#f5f3ff)",
    logo_text: "KIA",
    phone: "+998901234568",
  },
  {
    id: "uzauto_motors",
    brand: "UzAuto",
    title: "UzAuto Motors Nukus",
    subtitle: "Tracker, Equinox, Monza — stock bor. Trade-In qabul!",
    cta: "Salonga boring →",
    color: "#059669",
    bg: "linear-gradient(135deg,#d1fae5,#ecfdf5)",
    logo_text: "GM",
    phone: "+998901234569",
  },
];

export default function SponsoredCarCard({ sponsor }) {
  const { am } = useAutoMarketI18n();
  if (!sponsor) return null;

  const handleClick = () => {
    if (sponsor.phone) window.location.href = `tel:${sponsor.phone}`;
    else if (sponsor.onClick) sponsor.onClick();
  };

  return (
    <div
      onClick={handleClick}
      style={{
        background: sponsor.bg || "#f8fafc",
        border: `1.5px solid ${sponsor.color}33`,
        borderRadius: 18,
        overflow: "hidden",
        cursor: "pointer",
        boxShadow: "0 10px 30px rgba(2,6,23,.06)",
        position: "relative",
      }}
    >
      {/* {am("sponsor.ad")} belgisi */}
      <div style={{ position:"absolute", top:10, right:10, zIndex:2 }}>
        <Tag style={{
          fontSize:10, borderRadius:999, background:"rgba(255,255,255,0.85)",
          border:"1px solid #e2e8f0", color:"#94a3b8", fontWeight:700, padding:"2px 8px"
        }}>
          {am("sponsor.ad")}
        </Tag>
      </div>

      <div style={{ padding: "16px 14px" }}>
        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
          <div style={{
            width:44, height:44, borderRadius:14,
            background: sponsor.color,
            display:"flex", alignItems:"center", justifyContent:"center",
            color:"#fff", fontWeight:900, fontSize:14,
            boxShadow: `0 8px 20px ${sponsor.color}44`,
          }}>
            {sponsor.logo_text || sponsor.brand?.slice(0,2)}
          </div>
          <div>
            <div style={{ fontWeight:900, color:"#0f172a", fontSize:14 }}>{sponsor.title}</div>
            <div style={{ display:"flex", gap:4, alignItems:"center" }}>
              <StarFilled style={{ color:"#FFD700", fontSize:11 }} />
              <span style={{ fontSize:11, color:"#64748b" }}>Rasmiy diler</span>
            </div>
          </div>
        </div>

        <div style={{ fontSize:13, color:"#334155", marginBottom:12, lineHeight:1.4 }}>
          {sponsor.subtitle}
        </div>

        <div style={{
          display:"inline-flex", alignItems:"center", gap:4,
          background: sponsor.color,
          color:"#fff", borderRadius:999, padding:"6px 14px",
          fontSize:12, fontWeight:800,
          boxShadow: `0 4px 12px ${sponsor.color}55`,
        }}>
          {sponsor.cta || "Batafsil"} <RightOutlined style={{ fontSize:10 }} />
        </div>
      </div>
    </div>
  );
}
