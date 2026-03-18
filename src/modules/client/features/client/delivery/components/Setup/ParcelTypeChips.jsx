import React from "react";
import { Card } from "antd";
import { useClientText } from "../../shared/i18n_clientLocalize";
import { orderAssets } from "@/assets/order";

export default function ParcelTypeChips({ value, onChange }) {
  const { cp } = useClientText();
  const chips = [
    { id: "document", label: cp("Hujjat"), emoji: "📄", icon: orderAssets.orderSupportAlt },
    { id: "keys", label: cp("Kalit"), emoji: "🔑", icon: orderAssets.serviceLock },
    { id: "box_small", label: cp("Kichik quti"), emoji: "📦", icon: orderAssets.orderBoxOpen || orderAssets.orderBox },
    { id: "box_large", label: cp("Katta quti"), emoji: "🧰", icon: orderAssets.orderBox },
    { id: "flowers", label: cp("Gul"), emoji: "💐", icon: orderAssets.orderMarket },
  ];
  return (
    <Card style={{ borderRadius: 18 }} bodyStyle={{ padding: 14 }}>
      <div style={{ fontWeight: 1000, marginBottom: 10 }}>{cp("Yuk turi")}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {chips.map((c) => {
          const active = value === c.id;
          return (
            <button
              key={c.id}
              onClick={() => onChange?.(c.id)}
              style={{
                borderRadius: 16,
                border: active ? "2px solid #1677ff" : "1px solid rgba(0,0,0,.1)",
                background: active ? "rgba(22,119,255,.08)" : "#fff",
                padding: "12px 10px",
                cursor: "pointer",
              }}
              type="button"
            >
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6 }}>
                <img src={c.icon} alt="" style={{ width: 22, height: 22, objectFit: "contain" }} />
                <span style={{ fontSize: 20 }}>{c.emoji}</span>
              </div>
              <div style={{ fontWeight: 900, fontSize: 12, marginTop: 6 }}>{c.label}</div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
