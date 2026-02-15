
import React, { useMemo } from "react";

export default function AdMeta({ ad }) {
  const priceText = useMemo(() => {
    const p = ad?.price ?? 0;
    const cur = ad?.currency || "$";
    return `${p.toLocaleString("ru-RU")} ${cur}`;
  }, [ad?.price, ad?.currency]);

  const rows = [
    ["Shahar", ad?.city],
    ["Yil", ad?.year],
    ["Yurgan", ad?.mileage ? `${Number(ad.mileage).toLocaleString("ru-RU")} km` : ""],
    ["Yoqilg'i", ad?.fuel],
    ["KPP", ad?.transmission],
    ["Rang", ad?.color],
    ["Obmen", ad?.exchange ? "Bor" : "Yo'q"],
    ["Kredit", ad?.kredit ? "Bor" : "Yo'q"],
  ].filter(([, v]) => v);

  return (
    <div style={{ padding: 12 }}>
      <div style={{ fontSize: 22, fontWeight: 900 }}>{priceText}</div>
      <div style={{ fontSize: 16, fontWeight: 700, marginTop: 6 }}>{ad?.title}</div>
      <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {rows.map(([k, v]) => (
          <div key={k} style={{ background: "white", border: "1px solid #f0f0f0", borderRadius: 12, padding: 10 }}>
            <div style={{ fontSize: 11, color: "#777" }}>{k}</div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
