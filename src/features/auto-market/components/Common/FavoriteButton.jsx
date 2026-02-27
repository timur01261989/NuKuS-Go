import React, { useEffect, useState } from "react";
import { HeartFilled, HeartOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { getFavorites, toggleFavorite } from "../../services/marketApi";

export default function FavoriteButton({ adId, size = "middle", onChanged }) {
  const [fav, setFav] = useState(false);
  useEffect(() => {
    (async () => {
      const set = await getFavorites();
      setFav(set.has(String(adId)));
    })();
  }, [adId]);

  const onClick = async (e) => {
    e?.stopPropagation?.();
    const list = await toggleFavorite(adId);
    const isFav = list.includes(String(adId));
    setFav(isFav);
    onChanged?.(isFav);
  };

  return (
    <Button
      size={size}
      shape="circle"
      onClick={onClick}
      aria-label="Sevimli"
      style={{
        border: "none",
        background: "rgba(255,255,255,.92)",
        boxShadow: "0 10px 26px rgba(0,0,0,.18)"
      }}
      icon={fav ? <HeartFilled style={{ color: "#ef4444" }} /> : <HeartOutlined />}
    />
  );
}
