import React from "react";
import PriceTag from "../Common/PriceTag";
import FavoriteButton from "../Common/FavoriteButton";
import StatusBadge from "../Common/StatusBadge";
import { evaluateInstantMarketValue, getDealBadgeMeta } from "../../services/instantMarketValue";

export default function CarCardVertical({ ad, onClick }) {
  if (!ad) return null;
  const badge = ad?.is_top ? "TOP" : null;
  const deal = evaluateInstantMarketValue({
    year: ad?.year,
    mileageKm: ad?.mileage,
    listedPrice: ad?.price,
    marketMedianPrice: ad?.market_median_price || ad?.price,
    conditionScore: ad?.inspection_score || 78,
  });
  const dealMeta = getDealBadgeMeta(deal.badge);

  return (
    <div
      onClick={onClick}
      style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 18,
        overflow: "hidden",
        cursor: "pointer",
        boxShadow: "0 10px 30px rgba(2,6,23,.06)",
      }}
    >
      <div style={{ position: "relative", height: 170 }}>
        <img src={ad.images?.[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", left: 10, top: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
          {badge ? <StatusBadge type={badge} /> : null}
          {ad.kredit ? <StatusBadge type="CREDIT" /> : null}
          {ad.exchange ? <StatusBadge type="EXCHANGE" /> : null}
          {ad.vikup ? <StatusBadge type="VIKUP" /> : null}
          {ad.barter ? <StatusBadge type="BARTER" /> : null}
          <span style={{ background: dealMeta.tone, color: dealMeta.color, padding: "4px 8px", borderRadius: 999, fontSize: 11, fontWeight: 800 }}>
            {dealMeta.label}
          </span>
        </div>
        <div style={{ position: "absolute", right: 10, top: 10 }}>
          <FavoriteButton adId={ad.id} />
        </div>
        <div style={{ position: "absolute", left: 10, bottom: 10 }}>
          <PriceTag price={ad.price} currency={ad.currency} />
        </div>
      </div>

      <div style={{ padding: 12 }}>
        <div style={{ fontWeight: 900, color: "#0f172a", fontSize: 14, lineHeight: 1.1 }}>
          {ad.brand} {ad.model}
        </div>
        <div style={{ marginTop: 6, fontSize: 12, color: "#64748b", display: "flex", gap: 10, flexWrap: "wrap" }}>
          <span>{ad.year}</span>
          <span>{ad.mileage?.toLocaleString?.("uz-UZ") || ad.mileage} km</span>
          <span>{ad.city}</span>
        </div>
        <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, color: "#334155", background: "#f8fafc", padding: "4px 8px", borderRadius: 999 }}>{ad.body_type || "Kuzov"}</span>
          <span style={{ fontSize: 11, color: "#334155", background: "#f8fafc", padding: "4px 8px", borderRadius: 999 }}>{ad.fuel_type || "Yoqilg‘i"}</span>
          {ad.battery_warranty ? <span style={{ fontSize: 11, color: "#065f46", background: "#ecfdf5", padding: "4px 8px", borderRadius: 999 }}>Batareya kafolati</span> : null}
        </div>
      </div>
    </div>
  );
}