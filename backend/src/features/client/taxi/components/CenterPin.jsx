import React from "react";

/** Center pin (sariq odam) overlay - UI only. Provide `html` (SVG) and dragging state. */
export default function CenterPin({ html, dragging = false, label }) {
  return (
    <div className={"yg-center-pin " + (dragging ? "lift" : "")}>
      <div dangerouslySetInnerHTML={{ __html: html }} />
      {label ? <div className="yg-center-label">{label}</div> : null}
    </div>
  );
}
