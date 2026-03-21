import React from "react";
import { Button, Card, Tag } from "antd";
import { ArrowLeftOutlined, AppstoreOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { buildMarketplaceHubCards } from "../services/autoMarketFinalPolish";

export default function AutoMarketHubPage() {
  const nav = useNavigate();
  const cards = buildMarketplaceHubCards();

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", paddingBottom: 120 }}>
      <div style={{ position: "sticky", top: 0, zIndex: 20, background: "#fff", padding: "12px 16px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 12 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => nav(-1)} />
        <div>
          <div style={{ fontWeight: 900, color: "#0f172a" }}>Auto-market hub</div>
          <div style={{ fontSize: 12, color: "#64748b" }}>Barcha asosiy oqimlarga tez kirish markazi</div>
        </div>
      </div>

      <div style={{ padding: 16, display: "grid", gap: 16 }}>
        <Card style={{ borderRadius: 24, border: "1px solid #e2e8f0", background: "linear-gradient(135deg,#eff6ff 0%,#ffffff 55%,#f8fafc 100%)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 900, color: "#0f172a", fontSize: 20 }}>Marketplace command center</div>
              <div style={{ marginTop: 6, color: "#475569" }}>Qidiruv, booking, dealer, finance va signal markazlari bitta hub ichida jamlandi.</div>
            </div>
            <Tag icon={<AppstoreOutlined />} color="blue" style={{ borderRadius: 999, margin: 0 }}>Final polish</Tag>
          </div>
        </Card>

        <div style={{ display: "grid", gap: 12 }}>
          {cards.map((item) => (
            <Card key={item.key} style={{ borderRadius: 22, border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 900, color: "#0f172a", fontSize: 18 }}>{item.title}</div>
                  <div style={{ marginTop: 6, color: "#475569" }}>{item.text}</div>
                </div>
                <Button type="primary" onClick={() => nav(item.route)} style={{ borderRadius: 14, background: item.tone, borderColor: item.tone }}>
                  {item.action}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
