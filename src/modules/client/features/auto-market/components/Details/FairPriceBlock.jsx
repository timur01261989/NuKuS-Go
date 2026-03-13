/**
 * FairPriceBlock.jsx
 * AI Narx Tahlili — "Bu narx qanchalik to'g'ri?"
 * Local bozor statistikasi asosida 🔴🟡🟢 indikator ko'rsatadi.
 *
 * Props:
 *  - car: { brand, model, year, mileage, price, currency }
 */
import React, { useEffect, useState } from "react";
import { Card, Spin, Progress } from "antd";
import { RobotOutlined } from "@ant-design/icons";
import { analyzeFairPrice } from "../../services/marketBackend";

export default function FairPriceBlock({ car }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!car?.brand || !car?.model || !car?.price) return;
    setLoading(true);
    analyzeFairPrice({
      brand:    car.brand,
      model:    car.model,
      year:     car.year,
      mileage:  car.mileage,
      price:    car.price,
      currency: car.currency,
    })
      .then(setResult)
      .catch(() => setResult(null))
      .finally(() => setLoading(false));
  }, [car?.brand, car?.model, car?.year, car?.price]);

  if (!car?.brand || !car?.price) return null;
  if (loading) return (
    <Card style={{ borderRadius: 18, border: "1px solid #e2e8f0" }} bodyStyle={{ padding: 16 }}>
      <div style={{ display:"flex", gap: 10, alignItems:"center" }}>
        <Spin size="small" />
        <span style={{ color:"#64748b", fontSize: 13 }}>AI narxni tahlil qilyapti...</span>
      </div>
    </Card>
  );
  if (!result || result.verdict === "unknown") return null;

  const pct = result.percentile ?? 50;
  const strokeColor = result.color;

  const fmt = (n) => Number(n||0).toLocaleString("uz-UZ");

  return (
    <Card
      style={{ borderRadius: 18, border: `1.5px solid ${result.color}22` }}
      bodyStyle={{ padding: 16 }}
    >
      <div style={{ display:"flex", gap: 10, alignItems:"flex-start" }}>
        <div style={{
          width: 42, height: 42, borderRadius: 16, flexShrink: 0,
          background: `linear-gradient(135deg, ${result.color}cc, ${result.color})`,
          display:"flex", alignItems:"center", justifyContent:"center", color:"#fff",
          boxShadow: `0 8px 20px ${result.color}44`,
        }}>
          <RobotOutlined style={{ fontSize: 20 }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 900, color: "#0f172a", fontSize: 14 }}>AI Narx Tahlili</div>
          <div style={{ marginTop: 4, fontWeight: 800, color: result.color, fontSize: 15 }}>
            {result.label}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom: 6, fontSize: 12, color:"#64748b" }}>
          <span>Bozordagi o'rin</span>
          <span style={{ fontWeight:800, color: result.color }}>{pct}% arzonroq</span>
        </div>
        <Progress
          percent={pct}
          strokeColor={strokeColor}
          trailColor="#e2e8f0"
          showInfo={false}
          size="small"
        />
      </div>

      {result.avg && (
        <div style={{ marginTop: 12, display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap: 8 }}>
          <div style={{ textAlign:"center", background:"#f8fafc", borderRadius: 10, padding:"8px 4px" }}>
            <div style={{ fontSize: 10, color:"#64748b" }}>Min</div>
            <div style={{ fontWeight:800, fontSize: 12 }}>{fmt(result.min)}</div>
          </div>
          <div style={{ textAlign:"center", background:"#f0fdf4", borderRadius: 10, padding:"8px 4px" }}>
            <div style={{ fontSize: 10, color:"#64748b" }}>O'rtacha</div>
            <div style={{ fontWeight:900, fontSize: 12, color:"#059669" }}>{fmt(result.avg)}</div>
          </div>
          <div style={{ textAlign:"center", background:"#f8fafc", borderRadius: 10, padding:"8px 4px" }}>
            <div style={{ fontSize: 10, color:"#64748b" }}>Max</div>
            <div style={{ fontWeight:800, fontSize: 12 }}>{fmt(result.max)}</div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 10, fontSize: 11, color:"#94a3b8" }}>
        {result.count} ta o'xshash e'lon tahlil qilindi
      </div>
    </Card>
  );
}
