import React from "react";
import PriceTag from "../Common/PriceTag";
import FavoriteButton from "../Common/FavoriteButton";

export default function CarCardHorizontal({ ad, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        gap: 12,
        padding: 10,
        borderRadius: 16,
        border: "1px solid #e2e8f0",
        background: "#fff",
        cursor: "pointer",
        boxShadow: "0 10px 26px rgba(2,6,23,.05)"
      }}
    >
      <div style={{ width: 120, height: 86, borderRadius: 14, overflow: "hidden", position: "relative", flex: "0 0 auto" }}>
        <img src={ad.images?.[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", left: 8, bottom: 8 }}>
          <PriceTag price={ad.price} currency={ad.currency} size={12} />
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 900, color: "#0f172a" }}>{ad.brand} {ad.model}</div>
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
          {ad.year} • {ad.city} • {ad.mileage?.toLocaleString?.("uz-UZ") || ad.mileage} km
        </div>
      </div>

      <div onClick={(e)=>e.stopPropagation()} style={{ alignSelf: "flex-start" }}>
        <FavoriteButton adId={ad.id} size="small" />
      </div>
    </div>
  );
}
