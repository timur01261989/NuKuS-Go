
import React from "react";

/** Avto uchun kichik badge (yil/shahar/kredit/obmen) */
export default function CarBadge({ children, color = "#1677ff" }) {
  return (
    <span style={{
      display: "inline-block",
      padding: "4px 8px",
      borderRadius: 999,
      background: color ? `${color}15` : "#f5f5f5",
      border: `1px solid ${color}33`,
      fontWeight: 700,
      fontSize: 11,
      color
    }}>
      {children}
    </span>
  );
}
