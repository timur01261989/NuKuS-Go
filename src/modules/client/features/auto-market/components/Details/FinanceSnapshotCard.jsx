import React from "react";
import { Card } from "antd";
import loanVisual from "@/assets/auto-market/pro/finance/finance-loan-calculator.png";
const screeningVisual = "@/assets/auto-market/pro/finance/finance-screening.svg";
import { buildFinanceHighlights } from "../../services/financeEstimator";

export default function FinanceSnapshotCard({ car }) {
  const items = buildFinanceHighlights(car);
  return (
    <Card style={{ borderRadius: 20, border: "1px solid #e2e8f0" }} styles={{ body: { padding: 16 } }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 900, color: "#0f172a" }}>Moliyalashtirish ko‘rinishi</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Boshlang‘ich to‘lov, oyiga taxminiy to‘lov va umumiy reja.</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <img src={loanVisual} alt="" style={{ width: 42, height: 42, objectFit: "contain" }} />
          <img src={screeningVisual} alt="" style={{ width: 42, height: 42, objectFit: "contain" }} />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 14 }}>
        {items.map((item) => (
          <div key={item.key} style={{ borderRadius: 16, padding: 12, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>{item.label}</div>
            <div style={{ marginTop: 6, fontWeight: 900, color: "#0f172a" }}>{item.value}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}