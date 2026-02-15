
import React from "react";
import { useNavigate } from "react-router-dom";
import PriceTag from "../Common/PriceTag";

export default function AdCardHorizontal({ ad }) {
  const nav = useNavigate();
  return (
    <div
      onClick={() => nav(`/market/ad/${ad.id}`)}
      style={{
        display: "flex", gap: 12, padding: 12,
        background: "white", border: "1px solid #f0f0f0",
        borderRadius: 16, cursor: "pointer"
      }}
    >
      <div style={{ width: 110, height: 84, borderRadius: 12, overflow: "hidden", background: "#f5f5f5" }}>
        {ad?.photos?.[0] ? <img src={ad.photos[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
      </div>
      <div style={{ flex: 1 }}>
        <PriceTag price={ad?.price} currency={ad?.currency} />
        <div style={{ fontWeight: 800, marginTop: 6 }}>{ad?.title}</div>
        <div style={{ color: "#777", fontSize: 12, marginTop: 4 }}>{ad?.city} • {ad?.year}</div>
      </div>
    </div>
  );
}
