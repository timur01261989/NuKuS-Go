import React from "react";
import { useMarketStore } from "../../stores/marketStore";

export default function FavoriteButton({ adId }) {
  const { favorites, toggleFavorite } = useMarketStore();
  const active = Boolean(favorites?.[adId]);

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(adId);
      }}
      aria-label="favorite"
      style={{
        width: 38,
        height: 38,
        borderRadius: 999,
        border: "none",
        background: active ? "#ef4444" : "rgba(255,255,255,0.9)",
        color: active ? "#fff" : "#111827",
        fontSize: 18,
        cursor: "pointer",
        boxShadow: "0 8px 20px rgba(0,0,0,0.18)",
      }}
    >
      {active ? "♥" : "♡"}
    </button>
  );
}
