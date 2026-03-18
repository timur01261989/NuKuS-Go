import React from "react";
import { useNavigate } from "react-router-dom";
import financeVisual from "@/assets/auto-market/pro/finance/finance-loan-simulation.png";
import inspectionVisual from "@/assets/auto-market/pro/inspection/inspection-certified.png";
import compareVisual from "@/assets/auto-market/pro/compare/compare-helper.png";

const cards = [
  { key: "finance", title: "Bo‘lib to‘lashni darrov ko‘ring", text: "Mashina sahifasiga kirmasdan turib ham kreditga moslarini toping.", asset: financeVisual, link: "/auto-market?tab=credit" },
  { key: "inspect", title: "Tekshiruvli e’lonlarni ajrating", text: "Ishonch kartalari va VIN bloklari bir ko‘rinishda turadi.", asset: inspectionVisual, link: "/auto-market?tab=trusted" },
  { key: "compare", title: "Bir nechta mashinani adashmay taqqoslang", text: "Solishtirish, narx signal va ko‘rish bandi bir joyda bo‘ladi.", asset: compareVisual, link: "/auto-market/compare" },
];

export default function MarketEntryGuide() {
  const navigate = useNavigate();
  return (
    <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
      {cards.map((card) => (
        <button
          key={card.key}
          type="button"
          onClick={() => navigate(card.link)}
          style={{ border: "1px solid #e2e8f0", borderRadius: 22, background: "#fff", padding: 14, display: "grid", gridTemplateColumns: "84px 1fr", gap: 14, textAlign: "left", cursor: "pointer", boxShadow: "0 12px 28px rgba(15,23,42,.05)" }}
        >
          <img src={card.asset} alt="" style={{ width: 84, height: 64, objectFit: "contain", borderRadius: 14, background: "#f8fafc" }} />
          <div>
            <div style={{ fontWeight: 900, color: "#0f172a" }}>{card.title}</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>{card.text}</div>
          </div>
        </button>
      ))}
    </div>
  );
}