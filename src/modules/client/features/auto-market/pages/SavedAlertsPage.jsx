
import React, { useMemo, useState } from "react";
import { Button, Empty, Tag } from "antd";
import { ArrowLeftOutlined, BellOutlined, DeleteOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useMarket } from "../context/MarketContext";
import { listSavedAlerts, removeSavedAlert, buildSavedAlertInsights } from "../services/autoMarketBuyerCore";

export default function SavedAlertsPage() {
  const nav = useNavigate();
  const { filters, patchFilters } = useMarket();
  const [items, setItems] = useState(() => listSavedAlerts());
  const insights = useMemo(() => buildSavedAlertInsights(items, filters), [items, filters]);

  return (
    <div style={{ padding: 14, paddingBottom: 86, background: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => nav(-1)} style={{ borderRadius: 12 }} />
        <div style={{ fontWeight: 900, fontSize: 18, color: "#0f172a" }}>Saqlangan alertlar</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10, marginBottom: 14 }}>
        {insights.map((item) => (
          <div key={item.key} style={{ borderRadius: 18, border: "1px solid #e2e8f0", background: "#fff", padding: 14 }}>
            <div style={{ fontSize: 12, color: "#64748b" }}>{item.label}</div>
            <div style={{ marginTop: 8, fontWeight: 900, color: "#0f172a" }}>{item.value}</div>
          </div>
        ))}
      </div>

      {!items.length ? (
        <Empty description="Hali alert saqlanmagan" />
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {items.map((item) => (
            <div key={item.id} style={{ borderRadius: 20, border: "1px solid #e2e8f0", background: "#fff", padding: 14, boxShadow: "0 14px 30px rgba(15,23,42,.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontWeight: 900, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
                    <BellOutlined />
                    {item.label}
                  </div>
                  <div style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {Object.entries(item.filters || {}).filter(([, value]) => value).slice(0, 6).map(([key, value]) => (
                      <Tag key={key} style={{ borderRadius: 999 }}>{`${key}: ${value}`}</Tag>
                    ))}
                  </div>
                </div>
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => setItems(removeSavedAlert(item.id))}
                  style={{ borderRadius: 12 }}
                />
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                <Button
                  type="primary"
                  style={{ borderRadius: 12 }}
                  onClick={() => {
                    patchFilters({ ...item.filters, savedAlertOnly: true });
                    nav("/auto-market");
                  }}
                >
                  Shu signal bilan ochish
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
