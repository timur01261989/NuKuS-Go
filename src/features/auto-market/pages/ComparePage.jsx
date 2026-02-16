import React from "react";
import { useMarketStore } from "../stores/marketStore";
import PriceTag from "../components/Common/PriceTag";

export default function ComparePage() {
  const { compare, removeFromCompare, clearCompare } = useMarketStore();

  return (
    <div style={{ padding: 16, maxWidth: 980, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 20, fontWeight: 900 }}>Solishtirish</div>
        {compare.length > 0 && (
          <button onClick={clearCompare} style={{ border: "none", background: "#ef4444", color: "#fff", padding: "8px 10px", borderRadius: 10, fontWeight: 900 }}>
            Tozalash
          </button>
        )}
      </div>

      {compare.length === 0 ? (
        <div style={{ opacity: 0.7 }}>Hozircha solishtirish ro'yxati bo'sh</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${compare.length}, 1fr)`, gap: 12 }}>
          {compare.map((c) => (
            <div key={c.id} style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 14, padding: 12 }}>
              <div style={{ fontWeight: 900, marginBottom: 8 }}>{c.title}</div>
              <PriceTag price={c.price} currency={c.currency} big={false} />
              <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>
                {c.year} • {c.mileage}km • {c.fuel} • {c.transmission}
              </div>
              <button onClick={() => removeFromCompare(c.id)} style={{ marginTop: 10, border: "none", background: "#111827", color: "#fff", padding: "8px 10px", borderRadius: 10, fontWeight: 900 }}>
                O'chirish
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
