import React from "react";

export default function CarLogo({ text = "AUTO", size = 34 }) {
  return (
    <div style={{
      width: size, height: size,
      borderRadius: 12,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg,#111827,#334155)",
      color: "#fff",
      fontWeight: 900,
      fontSize: Math.max(10, Math.round(size/3.2)),
      letterSpacing: 0.5,
      boxShadow: "0 10px 24px rgba(0,0,0,.25)"
    }}>
      {text}
    </div>
  );
}
