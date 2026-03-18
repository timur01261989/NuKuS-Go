
import React from "react";
import { Card, Button, Tag } from "antd";
import { buildLeadQuickActions } from "../../services/autoMarketLeads";

const HEAT_LABEL = {
  hot: { label: "Issiq lead", color: "red" },
  warm: { label: "Faol", color: "gold" },
  new: { label: "Yangi", color: "blue" },
};

export default function SellerLeadCard({ lead, onCall, onChat, onConfirm, onReschedule }) {
  const actions = buildLeadQuickActions(lead);
  const heat = HEAT_LABEL[lead.heat] || HEAT_LABEL.new;

  return (
    <Card style={{ borderRadius: 20, border: "1px solid #e2e8f0", boxShadow: "0 14px 30px rgba(15,23,42,.05)" }} styles={{ body: { padding: 16 } }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontWeight: 900, color: "#0f172a" }}>{lead.customer}</div>
          <div style={{ marginTop: 6, color: "#475569", fontSize: 13 }}>{lead.vehicle}</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Tag color={heat.color} style={{ margin: 0, borderRadius: 999 }}>{heat.label}</Tag>
          <Tag color="blue" style={{ margin: 0, borderRadius: 999 }}>{lead.stageTitle}</Tag>
        </div>
      </div>

      <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Tag style={{ borderRadius: 999 }}>Manba: {lead.source}</Tag>
        <Tag style={{ borderRadius: 999 }}>Narx: {lead.price ? `${lead.price.toLocaleString("ru-RU")} so‘m` : "—"}</Tag>
        <Tag style={{ borderRadius: 999 }}>Javob SLA: {lead.sellerReplySla}</Tag>
      </div>

      <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
        <div style={{ borderRadius: 16, padding: 12, border: "1px solid #e2e8f0", background: "#f8fafc" }}>
          <div style={{ fontSize: 12, color: "#64748b" }}>Keyingi qadam</div>
          <div style={{ marginTop: 6, fontWeight: 800, color: "#0f172a" }}>{lead.nextStep}</div>
        </div>
        <div style={{ borderRadius: 16, padding: 12, border: "1px solid #e2e8f0", background: "#f8fafc" }}>
          <div style={{ fontSize: 12, color: "#64748b" }}>Appointment</div>
          <div style={{ marginTop: 6, fontWeight: 800, color: "#0f172a" }}>{lead.appointment}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginTop: 14 }}>
        {actions.map((item) => (
          <div key={item.key} style={{ borderRadius: 16, padding: 12, border: `1px solid ${item.tone}22`, background: `${item.tone}10` }}>
            <div style={{ fontWeight: 800, color: "#0f172a" }}>{item.title}</div>
            <div style={{ marginTop: 6, fontSize: 12, color: "#475569" }}>{item.text}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
        <Button style={{ borderRadius: 12 }} onClick={() => onCall?.(lead)}>Qo‘ng‘iroq</Button>
        <Button style={{ borderRadius: 12 }} onClick={() => onChat?.(lead)}>Chat</Button>
        <Button type="primary" style={{ borderRadius: 12, background: "#0f172a", border: "none" }} onClick={() => onConfirm?.(lead)}>Tasdiqlash</Button>
        <Button style={{ borderRadius: 12 }} onClick={() => onReschedule?.(lead)}>Ko‘chirish</Button>
      </div>
    </Card>
  );
}
