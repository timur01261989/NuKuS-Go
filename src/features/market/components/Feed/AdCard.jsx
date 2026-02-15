
import React, { useMemo, useState } from "react";
import { HeartFilled, HeartOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { toggleFavorite } from "../../services/marketApi";

export default function AdCard({ ad }) {
  const nav = useNavigate();
  const [fav, setFav] = useState(false);

  const priceText = useMemo(() => {
    const p = ad?.price ?? 0;
    const cur = ad?.currency || "$";
    return `${p.toLocaleString("ru-RU")} ${cur}`;
  }, [ad?.price, ad?.currency]);

  return (
    <div
      onClick={() => nav(`/market/ad/${ad.id}`)}
      style={{
        background: "white",
        border: "1px solid #f0f0f0",
        borderRadius: 16,
        overflow: "hidden",
        cursor: "pointer",
        boxShadow: "0 6px 18px rgba(0,0,0,0.05)"
      }}
    >
      <div style={{ position: "relative", paddingTop: "68%", background: "#f5f5f5" }}>
        {ad?.photos?.[0] ? (
          <img
            src={ad.photos[0]}
            alt={ad.title}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
            loading="lazy"
          />
        ) : null}

        <button
          onClick={async (e) => {
            e.stopPropagation();
            const next = await toggleFavorite(ad.id);
            setFav(next);
          }}
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            width: 34,
            height: 34,
            borderRadius: 999,
            border: "none",
            background: "rgba(255,255,255,0.9)",
            display: "grid",
            placeItems: "center"
          }}
        >
          {fav ? <HeartFilled style={{ color: "#ff4d4f" }} /> : <HeartOutlined style={{ color: "#555" }} />}
        </button>
      </div>

      <div style={{ padding: 10 }}>
        <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4 }}>{priceText}</div>
        <div style={{ fontSize: 12, color: "#333", lineHeight: 1.2, minHeight: 30 }}>
          {ad?.title}
        </div>
        <div style={{ fontSize: 11, color: "#777", marginTop: 6 }}>
          {ad?.city} • {ad?.year}
        </div>
      </div>
    </div>
  );
}
