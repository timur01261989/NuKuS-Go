import React from "react";
import PriceTag from "../Common/PriceTag";
import FavoriteButton from "../Common/FavoriteButton";
import StatusBadge from "../Common/StatusBadge";

/**
 * CarCardVertical
 * Asl funksionallik to'liq saqlangan.
 * YANGI: vikup va barter badge'lari qo'shildi
 */
export default function CarCardVertical({ ad, onClick }) {
  if (!ad) return null;
  const badge = ad?.is_top ? "TOP" : null;
  return (
    <div
      onClick={onClick}
      style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 18,
        overflow: "hidden",
        cursor: "pointer",
        boxShadow: "0 10px 30px rgba(2,6,23,.06)"
      }}
    >
      <div style={{ position: "relative", height: 170 }}>
        <img src={ad.images?.[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", left: 10, top: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
          {badge       ? <StatusBadge type={badge}    /> : null}
          {ad.kredit   ? <StatusBadge type="CREDIT"   /> : null}
          {ad.exchange ? <StatusBadge type="EXCHANGE" /> : null}
          {/* YANGI */}
          {ad.vikup    ? <StatusBadge type="VIKUP"    /> : null}
          {ad.barter   ? <StatusBadge type="BARTER"   /> : null}
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
      </div>
    </div>
  );
}
