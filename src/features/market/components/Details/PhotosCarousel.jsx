
import React, { useMemo, useState } from "react";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";

export default function PhotosCarousel({ photos = [] }) {
  const list = useMemo(() => (Array.isArray(photos) ? photos : []).filter(Boolean), [photos]);
  const [idx, setIdx] = useState(0);

  const has = list.length > 0;
  const current = has ? list[Math.min(idx, list.length - 1)] : null;

  return (
    <div style={{ position: "relative", background: "#f5f5f5" }}>
      <div style={{ paddingTop: "70%" }} />
      {current ? (
        <img
          src={current}
          alt="photo"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : null}

      {list.length > 1 ? (
        <>
          <button
            onClick={() => setIdx((p) => (p <= 0 ? list.length - 1 : p - 1))}
            style={btnStyle("left")}
          >
            <LeftOutlined />
          </button>
          <button
            onClick={() => setIdx((p) => (p >= list.length - 1 ? 0 : p + 1))}
            style={btnStyle("right")}
          >
            <RightOutlined />
          </button>
          <div style={{
            position: "absolute", bottom: 10, left: 0, right: 0,
            display: "flex", justifyContent: "center", gap: 6
          }}>
            {list.map((_, i) => (
              <span key={i} style={{
                width: 6, height: 6, borderRadius: 999,
                background: i === idx ? "white" : "rgba(255,255,255,0.5)"
              }} />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

function btnStyle(side) {
  return {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    [side]: 10,
    width: 34,
    height: 34,
    borderRadius: 999,
    border: "none",
    background: "rgba(255,255,255,0.85)",
    display: "grid",
    placeItems: "center"
  };
}
