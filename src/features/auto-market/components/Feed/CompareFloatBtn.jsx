import React from "react";
import { Link } from "react-router-dom";
import { useMarketStore } from "../../stores/marketStore";

export default function CompareFloatBtn() {
  const { compare } = useMarketStore();
  if (!compare.length) return null;

  return (
    <Link to="/auto-market/compare" style={{ textDecoration: "none" }}>
      <div
        style={{
          position: "fixed",
          right: 16,
          bottom: 16,
          background: "#1677ff",
          color: "#fff",
          borderRadius: 999,
          padding: "12px 14px",
          fontWeight: 900,
          boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
          zIndex: 999,
        }}
      >
        ⚖️ Solishtirish ({compare.length})
      </div>
    </Link>
  );
}
