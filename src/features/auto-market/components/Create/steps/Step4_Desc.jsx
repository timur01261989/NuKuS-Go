import React from "react";
import { Card, Input, InputNumber, Select } from "antd";
import { useCreateAd } from "../../../context/CreateAdContext";
import { useAutoMarketI18n } from "../../../utils/useAutoMarketI18n";

export default function Step4_Desc() {
  const { ad, patch } = useCreateAd();
  const { am } = useAutoMarketI18n();
  return (
    <Card style={{ borderRadius: 18, border: "1px solid #e2e8f0" }} bodyStyle={{ padding: 14 }}>
      <div style={{ fontWeight: 900, color: "#0f172a" }}>{am("autoExtra.priceAndDesc")}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: 10, marginTop: 12 }}>
        <div>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>{am("common.price")}</div>
          <InputNumber value={ad.price ? Number(ad.price) : null} onChange={(v)=>patch({ price: v })} style={{ width: "100%" }} min={0} placeholder="65000000" />
        </div>
        <div>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>{am("autoExtra.currency")}</div>
          <Select value={ad.currency} onChange={(v)=>patch({ currency: v })} options={[{value:"UZS",label:"UZS"},{value:"USD",label:"USD"}]} style={{ width: "100%" }} />
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>{am("autoExtra.title")}</div>
        <Input value={ad.title} onChange={(e)=>patch({ title: e.target.value })} placeholder={am("create.titlePlaceholder")} />
      </div>
      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>{am("autoExtra.description")}</div>
        <Input.TextArea rows={5} value={ad.description} onChange={(e)=>patch({ description: e.target.value })} placeholder={am("create.descPlaceholder")} />
      </div>
    </Card>
  );
}
