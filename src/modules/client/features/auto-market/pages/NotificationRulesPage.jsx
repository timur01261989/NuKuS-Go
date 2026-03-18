import React from "react";
import { Button, Card, Tag } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { buildNotificationRules } from "../services/autoMarketMarketplaceFinal";
import { buildNotificationRuleBoosts } from "../services/autoMarketExtendedSignals";

export default function NotificationRulesPage() {
  const nav = useNavigate();
  const rules = buildNotificationRules();
  const boosts = buildNotificationRuleBoosts(rules);

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", paddingBottom: 120 }}>
      <div style={{ position: "sticky", top: 0, zIndex: 20, background: "#fff", padding: "12px 16px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 12 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => nav(-1)} />
        <div>
          <div style={{ fontWeight: 900, color: "#0f172a" }}>Notification rules</div>
          <div style={{ fontSize: 12, color: "#64748b" }}>Alert, booking, finance va seller signal qoidalari</div>
        </div>
      </div>

      <div style={{ padding: 16, display: "grid", gap: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 10 }}>
          {boosts.map((item) => (
            <Card key={item.key} style={{ borderRadius: 18, border: "1px solid #dbeafe", background: "#f8fbff" }}>
              {item.asset ? <img src={item.asset} alt={item.title} style={{ width: 42, height: 42, objectFit: "contain", marginBottom: 10 }} /> : null}
              <div style={{ fontWeight: 900, color: "#0f172a" }}>{item.title}</div>
              <div style={{ marginTop: 6, color: "#475569" }}>{item.note}</div>
            </Card>
          ))}
        </div>
        {rules.map((rule) => (
          <Card key={rule.key} style={{ borderRadius: 22, border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontWeight: 900, color: "#0f172a" }}>{rule.title}</div>
                <div style={{ marginTop: 6, color: "#475569" }}>{rule.text}</div>
                <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>Yo‘nalish: {rule.route}</div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Tag color={rule.severity === "high" ? "red" : "blue"} style={{ borderRadius: 999, margin: 0 }}>{rule.severity}</Tag>
                <Tag color="gold" style={{ borderRadius: 999, margin: 0 }}>{rule.channel}</Tag>
              </div>
            </div>
            <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Button type="primary" onClick={() => nav(rule.route)} style={{ borderRadius: 14 }}>
                Tegishli oqimni ochish
              </Button>
              <Button onClick={() => nav("/auto-market/notifications")} style={{ borderRadius: 14 }}>
                Markazga qaytish
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
