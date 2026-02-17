import React from "react";
import { Card, Input, Select, Switch } from "antd";
import { useCreateAd } from "../../../context/CreateAdContext";
import { CITIES, FUELS, TRANSMISSIONS, COLORS, BODY_TYPES, DRIVE_TYPES } from "../../../services/staticData";

export default function Step2_Specs() {
  const { ad, patch } = useCreateAd();

  return (
    <Card style={{ borderRadius: 18, border: "1px solid #e2e8f0" }} bodyStyle={{ padding: 14 }}>
      <div style={{ fontWeight: 900, color: "#0f172a" }}>Parametrlar</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
        <div>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>Yil</div>
          <Input value={ad.year} onChange={(e)=>patch({ year: e.target.value })} placeholder="Masalan: 2020" />
        </div>
        <div>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>Probeg (km)</div>
          <Input value={ad.mileage} onChange={(e)=>patch({ mileage: e.target.value })} placeholder="Masalan: 85000" />
        </div>

        <div>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>Yoqilg'i</div>
          <Select value={ad.fuel_type || undefined} onChange={(v)=>patch({ fuel_type: v })} options={FUELS.map(x=>({value:x,label:x}))} style={{ width: "100%" }} />
        </div>
        <div>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>Uzatma</div>
          <Select value={ad.transmission || undefined} onChange={(v)=>patch({ transmission: v })} options={TRANSMISSIONS.map(x=>({value:x,label:x}))} style={{ width: "100%" }} />
        </div>

        <div>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>Rang</div>
          <Select value={ad.color || undefined} onChange={(v)=>patch({ color: v })} options={COLORS.map(x=>({value:x,label:x}))} style={{ width: "100%" }} />
        </div>
        <div>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>Shahar</div>
          <Select value={ad.city || undefined} onChange={(v)=>patch({ city: v, location: { ...ad.location, city: v } })} options={CITIES.map(x=>({value:x,label:x}))} style={{ width: "100%" }} />
        </div>

        <div>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>Kuzov</div>
          <Select value={ad.body_type || undefined} onChange={(v)=>patch({ body_type: v })} options={BODY_TYPES.map(x=>({value:x,label:x}))} style={{ width: "100%" }} />
        </div>
        <div>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>Privod</div>
          <Select value={ad.drive_type || undefined} onChange={(v)=>patch({ drive_type: v })} options={DRIVE_TYPES.map(x=>({value:x,label:x}))} style={{ width: "100%" }} />
        </div>

        <div>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>Motor</div>
          <Input value={ad.engine} onChange={(e)=>patch({ engine: e.target.value })} placeholder="Masalan: 1.6L" />
        </div>
        <div>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>VIN (ixtiyoriy)</div>
          <Input value={ad.vin} onChange={(e)=>patch({ vin: e.target.value })} placeholder="XTA..." />
        </div>
      </div>

      <div style={{ display: "flex", gap: 14, marginTop: 14, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Switch checked={!!ad.kredit} onChange={(v)=>patch({ kredit: v })} />
          <span style={{ fontWeight: 800, color: "#0f172a" }}>Kredit</span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Switch checked={!!ad.exchange} onChange={(v)=>patch({ exchange: v })} />
          <span style={{ fontWeight: 800, color: "#0f172a" }}>Obmen</span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Switch checked={!!ad.is_top} onChange={(v)=>patch({ is_top: v })} />
          <span style={{ fontWeight: 800, color: "#0f172a" }}>TOP e'lon</span>
        </div>
      </div>
    </Card>
  );
}
