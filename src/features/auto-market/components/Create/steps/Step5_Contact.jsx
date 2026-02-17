import React from "react";
import { Card, Input } from "antd";
import { useCreateAd } from "../../../context/CreateAdContext";

export default function Step5_Contact() {
  const { ad, patch } = useCreateAd();
  const seller = ad.seller || {};
  return (
    <Card style={{ borderRadius: 18, border: "1px solid #e2e8f0" }} bodyStyle={{ padding: 14 }}>
      <div style={{ fontWeight: 900, color: "#0f172a" }}>Kontakt</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
        <div>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>Ism</div>
          <Input value={seller.name} onChange={(e)=>patch({ seller: { ...seller, name: e.target.value } })} placeholder="Sotuvchi ismi" />
        </div>
        <div>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>Telefon</div>
          <Input value={seller.phone} onChange={(e)=>patch({ seller: { ...seller, phone: e.target.value } })} placeholder="+998..." />
        </div>
      </div>

      <div style={{ marginTop: 12, fontSize: 12, color: "#64748b" }}>
        Eslatma: Telefon raqamini to'g'ri kiriting — xaridorlar siz bilan bog'lanadi.
      </div>
    </Card>
  );
}
