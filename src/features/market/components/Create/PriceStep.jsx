
import React from "react";
import { Input, Select } from "antd";
import { useCreateAd } from "../../context/CreateAdContext";

export default function PriceStep() {
  const { ad, patch } = useCreateAd();
  return (
    <div style={{ padding: 12, display: "grid", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 110px", gap: 10 }}>
        <div>
          <div style={label}>Narx</div>
          <Input value={ad.price} onChange={(e) => patch({ price: e.target.value })} placeholder="5000" />
        </div>
        <div>
          <div style={label}>Valyuta</div>
          <Select
            value={ad.currency}
            onChange={(v) => patch({ currency: v })}
            style={{ width: "100%" }}
            options={[
              { value: "$", label: "$" },
              { value: "so'm", label: "so'm" },
            ]}
          />
        </div>
      </div>

      <div>
        <div style={label}>Tavsif</div>
        <Input.TextArea rows={5} value={ad.description} onChange={(e) => patch({ description: e.target.value })} placeholder="Qo'shimcha ma'lumot..." />
      </div>
    </div>
  );
}

const label = { fontSize: 12, color: "#555", marginBottom: 6, fontWeight: 700 };
