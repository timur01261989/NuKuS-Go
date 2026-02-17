import React from "react";

/**
 * CarSkeleton
 * Feed sahifada yuklanayotganda kartochka skeletoni.
 *
 * Props:
 *  - variant: "vertical" | "horizontal"
 *  - count: nechta skeleton chiqsin
 */
export default function CarSkeleton({ variant = "vertical", count = 6 }) {
  const items = Array.from({ length: Math.max(1, count) });

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {items.map((_, i) => (
        <div
          key={i}
          style={{
            borderRadius: 16,
            background: "#0f172a0a",
            border: "1px solid rgba(15,23,42,0.08)",
            overflow: "hidden",
            boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
          }}
        >
          {/* Image block */}
          <div
            style={{
              height: variant === "horizontal" ? 140 : 200,
              background:
                "linear-gradient(90deg, rgba(15,23,42,0.06) 25%, rgba(15,23,42,0.12) 37%, rgba(15,23,42,0.06) 63%)",
              backgroundSize: "400% 100%",
              animation: "am-skeleton 1.2s ease-in-out infinite",
            }}
          />

          {/* Text blocks */}
          <div style={{ padding: 14, display: "grid", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div
                style={{
                  height: 14,
                  width: "55%",
                  borderRadius: 10,
                  background:
                    "linear-gradient(90deg, rgba(15,23,42,0.06) 25%, rgba(15,23,42,0.12) 37%, rgba(15,23,42,0.06) 63%)",
                  backgroundSize: "400% 100%",
                  animation: "am-skeleton 1.2s ease-in-out infinite",
                }}
              />
              <div
                style={{
                  height: 14,
                  width: 90,
                  borderRadius: 10,
                  background:
                    "linear-gradient(90deg, rgba(15,23,42,0.06) 25%, rgba(15,23,42,0.12) 37%, rgba(15,23,42,0.06) 63%)",
                  backgroundSize: "400% 100%",
                  animation: "am-skeleton 1.2s ease-in-out infinite",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              {[1, 2, 3].map((k) => (
                <div
                  key={k}
                  style={{
                    height: 26,
                    width: 86,
                    borderRadius: 999,
                    background:
                      "linear-gradient(90deg, rgba(15,23,42,0.06) 25%, rgba(15,23,42,0.12) 37%, rgba(15,23,42,0.06) 63%)",
                    backgroundSize: "400% 100%",
                    animation: "am-skeleton 1.2s ease-in-out infinite",
                  }}
                />
              ))}
            </div>

            <div
              style={{
                height: 12,
                width: "70%",
                borderRadius: 10,
                background:
                  "linear-gradient(90deg, rgba(15,23,42,0.06) 25%, rgba(15,23,42,0.12) 37%, rgba(15,23,42,0.06) 63%)",
                backgroundSize: "400% 100%",
                animation: "am-skeleton 1.2s ease-in-out infinite",
              }}
            />
          </div>

          {/* Local keyframes once */}
          {i === 0 && (
            <style>{`
              @keyframes am-skeleton {
                0% { background-position: 100% 0; }
                100% { background-position: 0 0; }
              }
            `}</style>
          )}
        </div>
      ))}
    </div>
  );
}
