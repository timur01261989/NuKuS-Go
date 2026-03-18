import React from "react";
import { Button, Card, Tag } from "antd";
import { ArrowLeftOutlined, BellOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { buildAutoMarketNotifications, buildNotificationRules } from "../services/autoMarketMarketplaceFinal";
import { buildNotificationRuleHealth, buildMarketplaceHubCards } from "../services/autoMarketFinalPolish";
import { buildNotificationSignalDeck } from "../services/autoMarketExtendedSignals";

export default function AutoMarketNotificationsPage() {
  const nav = useNavigate();
  const items = buildAutoMarketNotifications();
  const rules = buildNotificationRules();
  const ruleHealth = buildNotificationRuleHealth(rules, items);
  const hubCards = buildMarketplaceHubCards().slice(0, 2);
  const signalDeck = buildNotificationSignalDeck(items);

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", paddingBottom: 120 }}>
      <div style={{ position: "sticky", top: 0, zIndex: 20, background: "#fff", padding: "12px 16px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 12 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => nav(-1)} />
        <div>
          <div style={{ fontWeight: 900, color: "#0f172a" }}>Notifications center</div>
          <div style={{ fontSize: 12, color: "#64748b" }}>Narx, booking, tekshiruv va javob yangiliklari</div>
        </div>
      </div>

      <div style={{ padding: 16, display: "grid", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 12 }}>
          {signalDeck.map((item) => (
            <Card key={item.key} style={{ borderRadius: 22, border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <img src={item.asset} alt={item.title} style={{ width: 54, height: 42, objectFit: "contain", borderRadius: 12, background: "#f8fafc", padding: 6 }} />
                <div>
                  <div style={{ fontWeight: 900, color: "#0f172a" }}>{item.title}</div>
                  <div style={{ marginTop: 4, fontSize: 12, color: "#64748b" }}>{item.note}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12 }}>
          {ruleHealth.map((item) => (
            <Card key={item.key} style={{ borderRadius: 22, border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: 12, color: "#64748b" }}>{item.label}</div>
              <div style={{ marginTop: 8, fontWeight: 900, color: "#0f172a", fontSize: 20 }}>{item.value}</div>
            </Card>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
          {hubCards.map((item) => (
            <Card key={item.key} style={{ borderRadius: 22, border: "1px solid #e2e8f0" }}>
              <div style={{ fontWeight: 900, color: "#0f172a" }}>{item.title}</div>
              <div style={{ marginTop: 6, color: "#475569" }}>{item.text}</div>
              <Button onClick={() => nav(item.route)} style={{ borderRadius: 14, marginTop: 12 }}>
                {item.action}
              </Button>
            </Card>
          ))}
        </div>

        <Card style={{ borderRadius: 22, border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontWeight: 900, color: "#0f172a" }}>Notification rules</div>
              <div style={{ marginTop: 6, color: "#475569" }}>Qaysi signal qayerga tushishini boshqarish markazi.</div>
            </div>
            <Button onClick={() => nav("/auto-market/notifications/rules")} style={{ borderRadius: 14 }}>
              Rule markazini ochish
            </Button>
          </div>
          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            {rules.slice(0, 3).map((rule) => (
              <div key={rule.key} style={{ borderRadius: 16, border: "1px solid #e2e8f0", padding: 12, display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontWeight: 800, color: "#0f172a" }}>{rule.title}</div>
                  <div style={{ marginTop: 4, color: "#475569" }}>{rule.text}</div>
                </div>
                <Tag color={rule.severity === "high" ? "red" : "blue"} style={{ margin: 0, borderRadius: 999 }}>{rule.channel}</Tag>
              </div>
            ))}
          </div>
        </Card>

        <div style={{ display: "grid", gap: 12 }}>
          {items.map((item) => (
            <Card key={item.key} style={{ borderRadius: 22, border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: `${item.tone}16`, color: item.tone, display: "grid", placeItems: "center", flexShrink: 0 }}>
                  <BellOutlined />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                    <div style={{ fontWeight: 900, color: "#0f172a" }}>{item.title}</div>
                    <Tag color="blue" style={{ margin: 0, borderRadius: 999 }}>{item.category || "signal"}</Tag>
                  </div>
                  <div style={{ marginTop: 6, color: "#475569" }}>{item.text}</div>
                  <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Button size="small" onClick={() => nav(item.route)} style={{ borderRadius: 12 }}>
                      Ochish
                    </Button>
                    <Button size="small" onClick={() => nav("/auto-market/notifications/rules")} style={{ borderRadius: 12 }}>
                      Rule moslash
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
