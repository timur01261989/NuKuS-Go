import React from "react";
import { Card, Button, Tag } from "antd";
import { CreditCardOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { buildLocalPaymentSummary } from "../../services/autoMarketLocalPayments";

export default function LocalPaymentOptionsCard({ ad, onPay }) {
  const summary = buildLocalPaymentSummary(ad);

  return (
    <Card style={{ borderRadius: 22, border: "1px solid #e2e8f0", boxShadow: "0 16px 36px rgba(15,23,42,.05)" }} bodyStyle={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontWeight: 900, color: "#0f172a", fontSize: 18 }}>{summary.title}</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>{summary.text}</div>
        </div>
        <Tag color="green" style={{ borderRadius: 999, paddingInline: 12, margin: 0 }}>Click · Payme · Humo · Uzcard</Tag>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
        {summary.providers.map((provider) => (
          <div key={provider.key} style={{ borderRadius: 999, padding: "8px 12px", border: `1px solid ${provider.accent}22`, background: `${provider.accent}10`, color: "#0f172a", fontWeight: 800 }}>
            {provider.title}
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 10, marginTop: 14 }}>
        {summary.plan.map((item) => (
          <div key={item.key} style={{ borderRadius: 18, padding: 14, border: `1px solid ${item.tone}22`, background: `${item.tone}10` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 900, color: "#0f172a" }}>
              {item.key === "inspection" ? <SafetyCertificateOutlined /> : <CreditCardOutlined />}
              {item.title}
            </div>
            <div style={{ fontSize: 12, color: "#475569", marginTop: 6, lineHeight: 1.55 }}>{item.subtitle}</div>
            <div style={{ marginTop: 10, fontWeight: 800, color: "#0f172a" }}>{item.amount.toLocaleString("ru-RU")} so‘m</div>
            <div style={{ marginTop: 4, fontSize: 11, color: "#64748b" }}>{item.providers.join(" · ").toUpperCase()}</div>
          </div>
        ))}
      </div>

      <Button type="primary" style={{ marginTop: 14, borderRadius: 14, background: "#0f172a", border: "none" }} onClick={onPay}>
        Mahalliy to‘lovni boshlash
      </Button>
    </Card>
  );
}
