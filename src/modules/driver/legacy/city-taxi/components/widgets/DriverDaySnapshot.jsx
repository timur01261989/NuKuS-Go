import React from "react";
import { buildDriverDayMetrics } from "@/modules/shared/taxi/utils/taxiProductSignals.js";

export default function DriverDaySnapshot({ earnings, activeOrder }) {
  const metrics = buildDriverDayMetrics({ earnings, activeOrder });
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.96)",
        borderRadius: 18,
        padding: 12,
        boxShadow: "0 10px 26px rgba(0,0,0,0.16)",
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0,1fr))",
        gap: 10,
        marginTop: 10,
      }}
    >
      <div>
        <div style={{ fontSize: 11, opacity: 0.65 }}>Bugun</div>
        <div style={{ fontWeight: 800 }}>{metrics.todayLabel}</div>
      </div>
      <div>
        <div style={{ fontSize: 11, opacity: 0.65 }}>Hafta</div>
        <div style={{ fontWeight: 800 }}>{metrics.weekLabel}</div>
      </div>
      <div>
        <div style={{ fontSize: 11, opacity: 0.65 }}>Safarlar</div>
        <div style={{ fontWeight: 800 }}>{metrics.tripsToday}</div>
      </div>
      <div>
        <div style={{ fontSize: 11, opacity: 0.65 }}>Holat</div>
        <div style={{ fontWeight: 800 }}>{metrics.activeState}</div>
      </div>
    </div>
  );
}
