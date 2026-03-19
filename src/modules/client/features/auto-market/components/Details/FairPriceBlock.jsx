import React, { useMemo } from "react";
import { Card, Progress, Tag } from "antd";
import { RobotOutlined } from "@ant-design/icons";
import { evaluateInstantMarketValue, getDealBadgeMeta } from "../../services/instantMarketValue";
const estimateVisual = "@/assets/auto-market/pro/pricing/price-estimate.svg";
import trendDown from "@/assets/auto-market/pro/pricing/price-trend-down.png";
import trendUp from "@/assets/auto-market/pro/pricing/price-trend-up.png";

export default function FairPriceBlock({ car }) {
  const result = useMemo(() => {
    if (!car?.brand || !car?.price) return null;
    return evaluateInstantMarketValue({
      make: car.brand,
      model: car.model,
      year: car.year,
      mileageKm: car.mileage,
      listedPrice: car.price,
      marketMedianPrice: car.market_median_price || car.price,
      conditionScore: car.inspection_score || 78,
    });
  }, [car]);

  if (!result) return null;

  const meta = getDealBadgeMeta(result.badge);
  const confidence = Math.max(10, 100 - Math.min(Math.abs(result.deltaPercent) * 3, 60));
  const trendVisual = result.deltaPercent > 0 ? trendUp : trendDown;

  return (
    <Card style={{ borderRadius: 20, border: `1px solid ${meta.color}26` }} styles={{ body: { padding: 16 } }}>
      <div style={{ display:"grid", gridTemplateColumns: "1.1fr .9fr", gap: 14, alignItems: "center" }}>
        <div>
          <div style={{ display:"flex", gap: 10, alignItems:"center" }}>
            <div style={{ width: 38, height: 38, borderRadius: 14, background: meta.tone, color: meta.color, display: "grid", placeItems: "center" }}>
              <RobotOutlined />
            </div>
            <div>
              <div style={{ fontWeight: 900, color: "#0f172a" }}>Bozor narxi tahlili</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Xaridor uchun aniq, sotuvchi uchun tushunarli signal.</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
            <Tag color={meta.color} style={{ borderRadius: 999, paddingInline: 10 }}>{meta.label}</Tag>
            <Tag style={{ borderRadius: 999, paddingInline: 10 }}>Taxminiy bozor: {result.estimatedValue.toLocaleString("uz-UZ")}</Tag>
          </div>

          <div style={{ marginTop: 14 }}>
            <Progress percent={confidence} strokeColor={meta.color} />
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 12, color: "#64748b" }}>
              <span>Ishonch indeksi</span>
              <span>{result.deltaPercent > 0 ? "+" : ""}{result.deltaPercent}%</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
            {result.reasons.map((reason) => <Tag key={reason} style={{ borderRadius: 999 }}>{reason}</Tag>)}
          </div>
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ borderRadius: 18, border: "1px solid #e2e8f0", background: "#f8fafc", padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <img src={estimateVisual} alt="" style={{ width: 40, height: 40 }} />
            <img src={trendVisual} alt="" style={{ width: 70, objectFit: "contain" }} />
          </div>
          <div style={{ fontSize: 12, color: "#475569" }}>
            “Juda yaxshi narx”, “Yaxshi narx” va “Narx balandroq” holatlari bir qarashda ko‘rinsin.
          </div>
        </div>
      </div>
    </Card>
  );
}