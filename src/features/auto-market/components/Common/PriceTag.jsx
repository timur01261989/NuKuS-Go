import React from "react";
import { formatPrice } from "../../services/priceUtils";

export default function PriceTag({ price, currency = "UZS", big = true }) {
  const txt = formatPrice(price, currency);
  return (
    <div style={{ fontSize: big ? 20 : 14, fontWeight: 900, color: currency === "USD" ? "#16a34a" : "#0f172a" }}>
      {txt}
    </div>
  );
}
