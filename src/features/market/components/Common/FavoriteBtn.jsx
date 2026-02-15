
import React, { useState } from "react";
import { HeartFilled, HeartOutlined } from "@ant-design/icons";
import { toggleFavorite } from "../../services/marketApi";

export default function FavoriteBtn({ adId, initial = false }) {
  const [fav, setFav] = useState(!!initial);

  return (
    <button
      onClick={async (e) => {
        e?.stopPropagation?.();
        const next = await toggleFavorite(adId);
        setFav(next);
      }}
      style={{
        width: 34,
        height: 34,
        borderRadius: 999,
        border: "none",
        background: "rgba(255,255,255,0.9)",
        display: "grid",
        placeItems: "center"
      }}
      aria-label="favorite"
      type="button"
    >
      {fav ? <HeartFilled style={{ color: "#ff4d4f" }} /> : <HeartOutlined style={{ color: "#555" }} />}
    </button>
  );
}
