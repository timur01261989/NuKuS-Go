import React from "react";
import { Card } from "antd";
import priceDropVisual from "@/assets/auto-market/pro/pricing/price-drop-car.webp";
import downVisual from "@/assets/auto-market/pro/pricing/price-trend-down.png";
import upVisual from "@/assets/auto-market/pro/pricing/price-trend-up.png";
import { buildPriceDropInsight } from "../../services/instantMarketValue";

export default function PriceDropCard({ history = [] }) {
  const insight = buildPriceDropInsight(history);
  if (!insight) return null;

  const color = insight.dropped ? "#16a34a" : insight.delta > 0 ? "#ef4444" : "#64748b";
  const supportVisual = insight.dropped ? downVisual : upVisual;

  return (
    <Card style={{ borderRadius: 20, border: `1px solid ${color}22` }} styles={{ body: { padding: 16 } }}>
      <div style={{ display: "grid", gridTemplateColumns: ".9fr 1.1fr", gap: 14, alignItems: "center" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <img src={priceDropVisual} alt="" style={{ width: 76, borderRadius: 14 }} />
          <img src={supportVisual} alt="" style={{ width: 48, height: 48, objectFit: "contain" }} />
        </div>
        <div>
          <div style={{ fontWeight: 900, color: "#0f172a" }}>{insight.label}</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
            Avvalgi narx: {insight.first.toLocaleString("uz-UZ")} • Hozirgi narx: {insight.last.toLocaleString("uz-UZ")}
          </div>
          <div style={{ marginTop: 8, fontWeight: 800, color }}>
            {insight.delta === 0 ? "Narx barqaror" : `${Math.abs(insight.delta).toLocaleString("uz-UZ")} so‘m ${insight.dropped ? "pasaygan" : "oshgan"}`}
          </div>
        </div>
      </div>
    </Card>
  );
}