import React, { useMemo } from "react";
import { Card, Select } from "antd";
import { useCreateAd } from "../../../context/CreateAdContext";
import { BRANDS, MODELS_BY_BRAND } from "../../../services/staticData";

export default function Step1_Brand() {
  const { ad, patch } = useCreateAd();

  const brandOptions = useMemo(() => BRANDS.map(b => ({ value: b.name, label: b.name })), []);
  const modelOptions = useMemo(() => (MODELS_BY_BRAND[ad.brand] || []).map(m => ({ value: m, label: m })), [ad.brand]);

  return (
    <Card style={{ borderRadius: 18, border: "1px solid #e2e8f0" }} bodyStyle={{ padding: 14 }}>
      <div style={{ fontWeight: 900, color: "#0f172a" }}>Marka va model</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
        <div>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>Marka</div>
          <Select
            value={ad.brand || undefined}
            placeholder="Tanlang"
            options={brandOptions}
            onChange={(v) => patch({ brand: v, model: "" })}
            style={{ width: "100%" }}
          />
        </div>

        <div>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>Model</div>
          <Select
            value={ad.model || undefined}
            placeholder={ad.brand ? "Model tanlang" : "Avval marka"}
            options={modelOptions}
            onChange={(v) => patch({ model: v })}
            style={{ width: "100%" }}
            disabled={!ad.brand}
          />
        </div>
      </div>

      <div style={{ marginTop: 12, fontSize: 12, color: "#64748b" }}>
        Maslahat: Mashina nomini to'g'ri tanlang — qidiruvda tez chiqadi.
      </div>
    </Card>
  );
}
