import React from "react";
import { Link } from "react-router-dom";
import PriceTag from "../Common/PriceTag";
import StatusBadge from "../Common/StatusBadge";
import FavoriteButton from "../Common/FavoriteButton";
import { useMarketStore } from "../../stores/marketStore";

export default function CarCardVertical({ car }) {
  const { addToCompare } = useMarketStore();
  return (
    <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 16, overflow: "hidden" }}>
      <div style={{ position: "relative" }}>
        <Link to={`/auto-market/details/${car.id}`}>
          <img src={(car.images || [])[0]} alt="" style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }} />
        </Link>
        <div style={{ position: "absolute", top: 10, left: 10 }}>{car.is_top ? <StatusBadge status="top" /> : <StatusBadge status="new" />}</div>
        <div style={{ position: "absolute", top: 10, right: 10 }}>
          <FavoriteButton adId={String(car.id)} />
        </div>
      </div>
      <div style={{ padding: 12 }}>
        <div style={{ fontWeight: 900, marginBottom: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{car.title}</div>
        <PriceTag price={car.price} currency={car.currency} />
        <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
          {car.year} • {car.mileage} km • {car.fuel} • {car.transmission}
        </div>
        <button
          onClick={() => addToCompare(car)}
          style={{ marginTop: 10, width: "100%", border: "none", background: "#111827", color: "#fff", padding: "10px 12px", borderRadius: 12, fontWeight: 900, cursor: "pointer" }}
        >
          Solishtirish
        </button>
      </div>
    </div>
  );
}
