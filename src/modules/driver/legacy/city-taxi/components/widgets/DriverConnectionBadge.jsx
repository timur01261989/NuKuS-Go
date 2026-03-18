import React from "react";
import { buildDriverConnectionMeta } from "@/modules/shared/taxi/utils/taxiProductSignals.js";

export default function DriverConnectionBadge({ updatedAt, accuracy, isOnline }) {
  const meta = buildDriverConnectionMeta({ updatedAt, accuracy, isOnline });
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.94)",
        borderRadius: 999,
        padding: "8px 12px",
        display: "flex",
        alignItems: "center",
        gap: 8,
        boxShadow: "0 8px 22px rgba(0,0,0,0.12)",
        fontSize: 12,
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: 999, background: meta.isHealthy ? "#52c41a" : "#faad14", display: "inline-block" }} />
      <span>Heartbeat: {meta.heartbeat}</span>
      <span style={{ opacity: 0.65 }}>GPS: {meta.accuracyBand}</span>
      <span style={{ opacity: 0.65 }}>Yangilandi: {meta.freshnessLabel}</span>
    </div>
  );
}
