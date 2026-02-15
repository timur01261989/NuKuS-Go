
import React, { useMemo } from "react";

/** Narxni chiroyli ko'rsatish (chip) */
export default function PriceTag({ price = 0, currency = "$" }) {
  const txt = useMemo(() => `${Number(price || 0).toLocaleString("ru-RU")} ${currency}`, [price, currency]);
  return (
    <span style={{
      display: "inline-block",
      padding: "6px 10px",
      borderRadius: 999,
      background: "#f5f5f5",
      fontWeight: 900,
      fontSize: 12
    }}>
      {txt}
    </span>
  );
}
