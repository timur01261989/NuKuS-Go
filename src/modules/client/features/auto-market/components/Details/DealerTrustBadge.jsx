import React from "react";
import { Tag } from "antd";
import certifiedVisual from "@/assets/auto-market/pro/inspection/inspection-certified.png";
import inspectionIcon from "@/assets/auto-market/pro/inspection/inspection-icon.png";

export default function DealerTrustBadge({ seller = {}, compact = false }) {
  const rating = Number(seller?.rating || 4.8);
  const trustLevel = rating >= 4.9 ? "Ishonchli premium" : rating >= 4.7 ? "Tasdiqlangan sotuvchi" : "Yangi sotuvchi";
  const color = rating >= 4.9 ? "#16a34a" : rating >= 4.7 ? "#0ea5e9" : "#f59e0b";

  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: `${color}12`, border: `1px solid ${color}25`, borderRadius: 999, padding: compact ? "4px 10px" : "6px 12px" }}>
        <img src={inspectionIcon} alt="" style={{ width: compact ? 18 : 20, height: compact ? 18 : 20, objectFit: "contain" }} />
        <span style={{ fontSize: compact ? 11 : 12, fontWeight: 800, color }}>{trustLevel}</span>
      </div>
      {!compact && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 999, padding: "6px 12px" }}>
          <img src={certifiedVisual} alt="" style={{ width: 20, height: 20, objectFit: "contain" }} />
          <span style={{ fontSize: 12, color: "#334155", fontWeight: 700 }}>Profil tekshiruvi mavjud</span>
        </div>
      )}
      <Tag color={rating >= 4.8 ? "green" : "blue"} style={{ borderRadius: 999, paddingInline: 10 }}>{rating.toFixed(1)} reyting</Tag>
    </div>
  );
}