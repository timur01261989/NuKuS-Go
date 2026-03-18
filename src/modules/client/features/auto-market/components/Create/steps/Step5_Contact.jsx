import React from "react";
import { Card, Input, Select } from "antd";
import { useCreateAd } from "../../../context/CreateAdContext";
import { CITIES } from "../../../services/staticData";
import { useAutoMarketI18n } from "../../../utils/useAutoMarketI18n";

export default function Step5_Contact() {
  const { ad, patch } = useCreateAd();
  const { am } = useAutoMarketI18n();
  return (
    <Card style={{ borderRadius: 18, border: "1px solid #e2e8f0" }} styles={{ body: { padding: 14 } }}>
      <div style={{ fontWeight: 900, color: "#0f172a" }}>{am("autoExtra.contact")}</div>
      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>{am("autoExtra.name")}</div>
        <Input value={ad.seller?.name || ""} onChange={(e)=>patch({ seller: { ...(ad.seller || {}), name: e.target.value } })} placeholder={am("autoExtra.name")} />
      </div>
      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>{am("autoExtra.phone")}</div>
        <Input value={ad.seller?.phone || ""} onChange={(e)=>patch({ seller: { ...(ad.seller || {}), phone: e.target.value } })} placeholder="+998 ..." />
      </div>
      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>{am("autoExtra.city")}</div>
        <Select value={ad.city || undefined} onChange={(v)=>patch({ city: v })} style={{ width: "100%" }} placeholder={am("autoExtra.select")} options={CITIES.map((x)=>({value:x,label:x}))} />
      </div>
    </Card>
  );
}
