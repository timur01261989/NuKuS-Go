import React, { useMemo } from "react";
import { Card, Progress, Tag } from "antd";
const inspectionTitle = "@/assets/auto-market/pro/inspection/inspection-title.svg";
import certificateArt from "@/assets/auto-market/pro/inspection/inspection-certificate.png";
const carFrontDim = "@/assets/auto-market/pro/inspection/photo-guide-front-dim.svg";
import { buildInspectionItemsFromCar, summarizeInspection } from "../../services/inspectionScoring";

const statusMeta = {
  ok: { label: "Toza", color: "#16a34a" },
  repair: { label: "Ta'mir izi", color: "#f59e0b" },
  replace: { label: "Almashgan", color: "#ef4444" },
  warning: { label: "Diqqat", color: "#f97316" },
  critical: { label: "Jiddiy", color: "#dc2626" },
  na: { label: "Ma'lumot yo'q", color: "#94a3b8" },
};

export default function InspectionViewer({ car }) {
  const items = useMemo(() => buildInspectionItemsFromCar(car), [car]);
  const summary = useMemo(() => summarizeInspection(items), [items]);

  return (
    <Card style={{ borderRadius: 20, border: "1px solid #e2e8f0", overflow: "hidden" }} styles={{ body: { padding: 16 } }}>
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr .8fr", gap: 14, alignItems: "center" }}>
        <div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <img src={inspectionTitle} alt="Tekshiruv" style={{ width: 24, height: 24 }} />
            <div>
              <div style={{ fontWeight: 900, color: "#0f172a" }}>Texnik tekshiruv ko‘rinishi</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Sotuvchi va xaridor bir xil tilda holatni ko‘rsin.</div>
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <Progress percent={summary.score} strokeColor={summary.score >= 85 ? "#16a34a" : summary.score >= 70 ? "#f59e0b" : "#ef4444"} />
            <div style={{ fontSize: 12, color: "#475569", fontWeight: 700 }}>{summary.verdict}</div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
            {items.map((item) => {
              const meta = statusMeta[item.status] || statusMeta.na;
              return <Tag key={item.checkpointCode} color={meta.color} style={{ borderRadius: 999 }}>{item.label}: {meta.label}</Tag>;
            })}
          </div>
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ background: "#f8fafc", borderRadius: 18, border: "1px solid #e2e8f0", padding: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <img src={certificateArt} alt="" style={{ width: 76, objectFit: "contain" }} />
            <img src={carFrontDim} alt="" style={{ width: 76, objectFit: "contain" }} />
          </div>
          <div style={{ fontSize: 12, color: "#64748b" }}>Kuzov, xavfsizlik va asosiy uzellar uchun qisqa ishonch kartasi.</div>
        </div>
      </div>
    </Card>
  );
}