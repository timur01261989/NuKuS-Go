
import React from "react";
import { Button } from "antd";
import { useNavigate } from "react-router-dom";

export default function MyAdCard({ ad }) {
  const nav = useNavigate();
  return (
    <div style={{
      background: "white", border: "1px solid #f0f0f0", borderRadius: 16,
      padding: 12, display: "flex", gap: 12, alignItems: "center"
    }}>
      <div style={{ width: 84, height: 64, borderRadius: 12, overflow: "hidden", background: "#f5f5f5" }}>
        {ad?.photos?.[0] ? <img src={ad.photos[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 800 }}>{ad?.title}</div>
        <div style={{ color: "#777", fontSize: 12, marginTop: 4 }}>{ad?.price} {ad?.currency}</div>
      </div>
      <Button onClick={() => nav(`/market/ad/${ad.id}`)} style={{ borderRadius: 12 }}>Ko'rish</Button>
    </div>
  );
}
