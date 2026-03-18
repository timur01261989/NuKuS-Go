import React from "react";
import PriceTag from "../Common/PriceTag";
import FavoriteButton from "../Common/FavoriteButton";
import { buildPremiumFeedSignals } from "../../services/autoMarketPremium";
import { buildPriceDropInsight } from "../../services/instantMarketValue";

export default function CarCardHorizontal({ ad, onClick }) {
  const signals = buildPremiumFeedSignals(ad).slice(0, 2);
  const priceDropInsight = buildPriceDropInsight(ad?.price_history || []);
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        gap: 12,
        padding: 12,
        borderRadius: 20,
        border: "1px solid #dbe4f0",
        background: "linear-gradient(180deg,#ffffff 0%,#f8fafc 100%)",
        cursor: "pointer",
        boxShadow: "0 16px 34px rgba(2,6,23,.06)"
      }}
    >
      <div style={{ width: 126, height: 92, borderRadius: 16, overflow: "hidden", position: "relative", flex: "0 0 auto" }}>
        <img src={ad.images?.[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", left: 8, bottom: 8 }}>
          <PriceTag price={ad.price} currency={ad.currency} size={12} />
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
          {signals.map((signal) => (
            <span key={signal.key} style={{ borderRadius: 999, padding: "4px 9px", fontSize: 11, fontWeight: 800, color: signal.tone, background: `${signal.tone}14` }}>
              {signal.label}
            </span>
          ))}
        </div>
        <div style={{ fontWeight: 900, color: "#0f172a" }}>{ad.brand} {ad.model}</div>
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
          {ad.year} • {ad.city} • {ad.mileage?.toLocaleString?.("uz-UZ") || ad.mileage} km
        </div>
        <div style={{ fontSize: 12, color: "#334155", marginTop: 8 }}>
          {ad?.body_type || "Sedan"} • {ad?.fuel || "Benzin"} • {ad?.transmission || "Avtomat"}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
          <span style={{ borderRadius: 999, padding: "4px 9px", fontSize: 11, fontWeight: 800, color: "#0f172a", background: "#e2e8f0" }}>
            {ad?.seller?.rating ? `Reyting ${Number(ad.seller.rating).toFixed(1)}` : "Sotuvchi ochiq"}
          </span>
          <span style={{ borderRadius: 999, padding: "4px 9px", fontSize: 11, fontWeight: 800, color: priceDropInsight?.dropped ? "#0ea5e9" : "#475569", background: priceDropInsight?.dropped ? "rgba(14,165,233,.14)" : "#f8fafc" }}>
            {priceDropInsight?.dropped ? "Narx tushgan" : "Narx barqaror"}
          </span>
        </div>
      </div>

      <div onClick={(e)=>e.stopPropagation()} style={{ alignSelf: "flex-start" }}>
        <FavoriteButton adId={ad.id} size="small" />
      </div>
    </div>
  );
}
