import React from "react";
import { formatPrice } from "../../services/priceUtils";

export default function PriceTag({ price, currency, size = 16, tone = "dark" }) {
  const text = formatPrice(price, currency);
  const bg = tone === "dark" ? "rgba(17,17,17,.88)" : "rgba(255,255,255,.9)";
  const color = tone === "dark" ? "#fff" : "#111";
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "6px 10px",
      borderRadius: 14,
      fontWeight: 800,
      fontSize: size,
      background: bg,
      color,
      boxShadow: "0 10px 26px rgba(0,0,0,.18)",
      backdropFilter: "blur(6px)",
      letterSpacing: 0.2
    }}>
      {text}
    </span>
  );
}
