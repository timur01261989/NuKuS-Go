import React from "react";
import { useClientText } from "../../shared/i18n_clientLocalize";
import { Card } from "antd";

export default function WeightSelector({ value, onChange }) {
  const { cp } = useClientText();
  const weights = [
    { id: 1, label: '< 1 kg', sub: cp('Yengil') },
    { id: 2, label: '5 kg', sub: cp('O‘rta') },
    { id: 3, label: '10 kg', sub: cp('Og‘ir') },
    { id: 4, label: '20 kg+', sub: cp('Juda og‘ir') },
  ];
  return (
    <Card style={{ borderRadius: 18 }} styles={{ body: { padding: 14 } }}>
      <div style={{ fontWeight: 1000, marginBottom: 10 }}>{cp('Og‘irlik')}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
        {weights.map((w) => {
          const active = value === w.id;
          return (
            <button key={w.id} onClick={() => onChange?.(w.id)} type="button" style={{ borderRadius: 16, border: active ? "2px solid #1677ff" : "1px solid rgba(0,0,0,.1)", background: active ? "rgba(22,119,255,.08)" : "#fff", padding: "12px 12px", cursor: "pointer", textAlign: "left" }}>
              <div style={{ fontWeight: 1000 }}>{w.label}</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>{w.sub}</div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
