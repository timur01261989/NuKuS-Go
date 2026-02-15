
import React from "react";
import { Input } from "antd";
import { useCreateAd } from "../../context/CreateAdContext";

export default function ContactStep() {
  const { ad, patch } = useCreateAd();
  return (
    <div style={{ padding: 12, display: "grid", gap: 12 }}>
      <div>
        <div style={label}>Ism</div>
        <Input value={ad.sellerName} onChange={(e) => patch({ sellerName: e.target.value })} placeholder="Ismingiz" />
      </div>
      <div>
        <div style={label}>Telefon</div>
        <Input value={ad.sellerPhone} onChange={(e) => patch({ sellerPhone: e.target.value })} placeholder="+998..." />
      </div>
    </div>
  );
}
const label = { fontSize: 12, color: "#555", marginBottom: 6, fontWeight: 700 };
