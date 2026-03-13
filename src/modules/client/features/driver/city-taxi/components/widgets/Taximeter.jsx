import React, { useEffect, useMemo, useState } from "react";
import { Card, Progress } from "antd";

/**
 * Taximeter.jsx
 * - vaqt + taxminiy progress
 * - keyin real distance/time GPS bilan bog'lab kengaytiriladi
 */
export default function Taximeter({ order }) {
  const [sec, setSec] = useState(0);

  useEffect(() => {
    if (!order) return;
    const t = setInterval(() => setSec((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [order?.id]);

  const price = useMemo(() => Number(order?.priceUzs || 0), [order?.priceUzs]);
  const timeText = useMemo(() => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${String(s).padStart(2,"0")}s`;
  }, [sec]);

  return (
    <Card style={{ borderRadius: 18, boxShadow: "0 10px 30px rgba(0,0,0,0.18)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontWeight: 900 }}>Taximeter</div>
        <div style={{ fontWeight: 800 }}>{price ? price.toLocaleString("uz-UZ")+" so‘m" : "-"}</div>
      </div>
      <div style={{ opacity: 0.8, marginBottom: 10 }}>Vaqt: {timeText}</div>
      <Progress percent={Math.min(99, Math.round((sec / 900) * 100))} showInfo={false} />
    </Card>
  );
}
