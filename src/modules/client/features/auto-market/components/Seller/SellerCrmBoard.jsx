import React from "react";
import { Card, Tag, Button } from "antd";
import { buildSellerCrmOverview, buildSellerLeadPipeline, buildSellerCrmAgenda } from "../../services/autoMarketSellerCrm";

export default function SellerCrmBoard({ items = [], onOpenLeads, onOpenAgenda }) {
  const overview = buildSellerCrmOverview(items);
  const leads = buildSellerLeadPipeline(items);
  const agenda = buildSellerCrmAgenda(items);

  return (
    <Card style={{ borderRadius: 22, border: "1px solid #e2e8f0", boxShadow: "0 16px 36px rgba(15,23,42,.05)" }} bodyStyle={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontWeight: 900, color: "#0f172a", fontSize: 18 }}>Seller CRM paneli</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>Leadlar, uchrashuvlar va qayta aloqa bir joydan boshqariladi.</div>
        </div>
        <Tag color="purple" style={{ borderRadius: 999, paddingInline: 12, margin: 0 }}>Lead · Booking · Follow-up</Tag>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginTop: 14 }}>
        {overview.map((item) => (
          <div key={item.key} style={{ borderRadius: 18, padding: 14, border: `1px solid ${item.tone}22`, background: `${item.tone}10` }}>
            <div style={{ fontWeight: 800, color: "#0f172a" }}>{item.title}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", marginTop: 10 }}>{item.value}</div>
            <div style={{ fontSize: 12, color: "#475569", marginTop: 6 }}>{item.text}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr .8fr", gap: 12, marginTop: 14 }}>
        <div style={{ borderRadius: 18, border: "1px solid #e2e8f0", padding: 14 }}>
          <div style={{ fontWeight: 900, color: "#0f172a" }}>Lead pipeline</div>
          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            {leads.map((lead) => (
              <div key={lead.key} style={{ borderRadius: 16, padding: 12, border: `1px solid ${lead.tone}22`, background: `${lead.tone}10` }}>
                <div style={{ fontWeight: 800, color: "#0f172a" }}>{lead.title}</div>
                <div style={{ marginTop: 6, fontSize: 12, color: "#475569" }}>{lead.stage}</div>
                <div style={{ marginTop: 4, fontSize: 11, color: "#64748b" }}>{lead.nextStep}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ borderRadius: 18, border: "1px solid #e2e8f0", padding: 14 }}>
          <div style={{ fontWeight: 900, color: "#0f172a" }}>Bugungi agenda</div>
          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            {agenda.map((item) => (
              <div key={item.key} style={{ borderRadius: 16, padding: 12, border: `1px solid ${item.tone}22`, background: `${item.tone}10` }}>
                <div style={{ fontWeight: 800, color: "#0f172a" }}>{item.time}</div>
                <div style={{ marginTop: 6, fontSize: 12, color: "#475569" }}>{item.title}</div>
                <div style={{ marginTop: 4, fontSize: 11, color: "#64748b" }}>{item.text}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
            <Button style={{ borderRadius: 14 }} onClick={onOpenLeads}>Leadlarni ochish</Button>
            <Button style={{ borderRadius: 14 }} onClick={onOpenAgenda}>Agenda</Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
