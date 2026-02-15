
import React from "react";
import { Input, Select } from "antd";
import { useCreateAd } from "../../context/CreateAdContext";

const cities = ["Nukus", "Toshkent", "Samarqand", "Buxoro", "Andijon", "Urganch", "Qarshi"];
const brands = ["Chevrolet", "KIA", "Hyundai", "Toyota", "Daewoo", "Mercedes", "BMW"];

export default function BasicInfoStep() {
  const { ad, patch } = useCreateAd();
  return (
    <div style={{ padding: 12, display: "grid", gap: 12 }}>
      <div>
        <div style={label}>Sarlavha</div>
        <Input value={ad.title} onChange={(e) => patch({ title: e.target.value })} placeholder="Masalan: Chevrolet Cobalt 2021" />
      </div>

      <div>
        <div style={label}>Brend</div>
        <Select
          value={ad.brand || undefined}
          onChange={(v) => patch({ brand: v || "" })}
          allowClear
          style={{ width: "100%" }}
          options={brands.map((b) => ({ value: b, label: b }))}
        />
      </div>

      <div>
        <div style={label}>Model</div>
        <Input value={ad.model} onChange={(e) => patch({ model: e.target.value })} placeholder="Masalan: Cobalt" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <div style={label}>Yil</div>
          <Input value={ad.year} onChange={(e) => patch({ year: e.target.value })} placeholder="2020" />
        </div>
        <div>
          <div style={label}>Shahar</div>
          <Select
            value={ad.city || undefined}
            onChange={(v) => patch({ city: v || "" })}
            allowClear
            style={{ width: "100%" }}
            options={cities.map((c) => ({ value: c, label: c }))}
          />
        </div>
      </div>
    </div>
  );
}

const label = { fontSize: 12, color: "#555", marginBottom: 6, fontWeight: 700 };
