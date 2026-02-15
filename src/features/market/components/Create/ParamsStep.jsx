
import React from "react";
import { Input, Select, Switch } from "antd";
import { useCreateAd } from "../../context/CreateAdContext";

export default function ParamsStep() {
  const { ad, patch } = useCreateAd();
  return (
    <div style={{ padding: 12, display: "grid", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <div style={label}>Yurgan (km)</div>
          <Input value={ad.mileage} onChange={(e) => patch({ mileage: e.target.value })} placeholder="100000" />
        </div>
        <div>
          <div style={label}>Rang</div>
          <Input value={ad.color} onChange={(e) => patch({ color: e.target.value })} placeholder="oq" />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <div style={label}>Yoqilg'i</div>
          <Select
            value={ad.fuel || undefined}
            onChange={(v) => patch({ fuel: v || "" })}
            allowClear
            style={{ width: "100%" }}
            options={[
              { value: "benzin", label: "Benzin" },
              { value: "gaz", label: "Gaz" },
              { value: "dizel", label: "Dizel" },
              { value: "gibrid", label: "Gibrid" },
              { value: "elektr", label: "Elektr" },
            ]}
          />
        </div>
        <div>
          <div style={label}>KPP</div>
          <Select
            value={ad.transmission || undefined}
            onChange={(v) => patch({ transmission: v || "" })}
            allowClear
            style={{ width: "100%" }}
            options={[
              { value: "avtomat", label: "Avtomat" },
              { value: "mexanika", label: "Mexanika" },
            ]}
          />
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={label}>Obmen</div>
        <Switch checked={ad.exchange} onChange={(v) => patch({ exchange: v })} />
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={label}>Kredit</div>
        <Switch checked={ad.kredit} onChange={(v) => patch({ kredit: v })} />
      </div>
    </div>
  );
}

const label = { fontSize: 12, color: "#555", marginBottom: 6, fontWeight: 700 };
