import React from "react";
import { useClientText } from "../../shared/i18n_clientLocalize";

export default function Legend() {
  const { cp } = useClientText();
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <span style={{ width: 14, height: 14, borderRadius: 4, background: "#fff", border: "1px solid #ddd" }} />
        <span style={{ fontSize: 12, color: "#555" }}>{cp("Bo'sh")}</span>
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <span style={{ width: 14, height: 14, borderRadius: 4, background: "#111", opacity: 0.15 }} />
        <span style={{ fontSize: 12, color: "#555" }}>{cp("Band")}</span>
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <span style={{ width: 14, height: 14, borderRadius: 4, background: "#1677ff" }} />
        <span style={{ fontSize: 12, color: "#555" }}>{cp("Sizniki")}</span>
      </div>
    </div>
  );
}
