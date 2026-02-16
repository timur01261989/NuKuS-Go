import React from "react";

export default function CarSkeleton({ count = 6 }) {
  const items = Array.from({ length: count });
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
      {items.map((_, i) => (
        <div key={i} style={{ background: "#fff", borderRadius: 16, padding: 12, border: "1px solid rgba(0,0,0,0.06)" }}>
          <div
            style={{
              height: 150,
              borderRadius: 12,
              background: "linear-gradient(90deg,#f1f5f9,#e2e8f0,#f1f5f9)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.2s infinite",
            }}
          />
          <div style={{ height: 14, marginTop: 10, width: "75%", borderRadius: 10, background: "#e2e8f0" }} />
          <div style={{ height: 14, marginTop: 8, width: "40%", borderRadius: 10, background: "#e2e8f0" }} />
          <style>{`
            @keyframes shimmer {
              0% { background-position: 200% 0; }
              100% { background-position: -200% 0; }
            }
          `}</style>
        </div>
      ))}
    </div>
  );
}
