
import React, { useMemo, useState } from "react";
import { Button, Empty, Tag } from "antd";
import { ArrowLeftOutlined, DeleteOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useMarket } from "../context/MarketContext";
import { listSavedSearches, removeSavedSearch, saveAlertDraft, buildSavedSearchInsights } from "../services/autoMarketBuyerCore";
import { buildSearchHoldGuidance } from "../services/autoMarketExtendedSignals";

export default function SavedSearchesPage() {
  const nav = useNavigate();
  const { filters, patchFilters } = useMarket();
  const [items, setItems] = useState(() => listSavedSearches());
  const insights = useMemo(() => buildSavedSearchInsights(items, filters), [items, filters]);
  const holdGuidance = useMemo(() => buildSearchHoldGuidance(filters), [filters]);

  return (
    <div style={{ padding: 14, paddingBottom: 80, background: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => nav(-1)} style={{ borderRadius: 12 }} />
        <div style={{ fontWeight: 900, fontSize: 18, color: "#0f172a" }}>Saqlangan qidiruvlar</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10, marginBottom: 14 }}>
        {holdGuidance.map((item) => (
          <div key={item.key} style={{ borderRadius: 18, border: "1px solid #dbeafe", background: "#eff6ff", padding: 14 }}>
            {item.asset ? <img src={item.asset} alt={item.title} style={{ width: 34, height: 34, objectFit: "contain", marginBottom: 10 }} /> : null}
            <div style={{ fontWeight: 900, color: "#0f172a" }}>{item.title}</div>
            <div style={{ marginTop: 6, fontSize: 12, color: "#475569" }}>{item.note}</div>
          </div>
        ))}
        {insights.map((item) => (
          <div key={item.key} style={{ borderRadius: 18, border: "1px solid #e2e8f0", background: "#fff", padding: 14 }}>
            <div style={{ fontSize: 12, color: "#64748b" }}>{item.label}</div>
            <div style={{ marginTop: 8, fontWeight: 900, color: "#0f172a" }}>{item.value}</div>
          </div>
        ))}
      </div>

      {!items.length ? (
        <Empty description="Hali saqlangan qidiruv yo'q" />
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {items.map((item) => (
            <div key={item.id} style={{ borderRadius: 20, border: "1px solid #e2e8f0", background: "#fff", padding: 14, boxShadow: "0 14px 30px rgba(15,23,42,.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontWeight: 900, color: "#0f172a" }}>{item.label}</div>
                  <div style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {Object.entries(item.filters || {}).filter(([, value]) => value).slice(0, 6).map(([key, value]) => (
                      <Tag key={key} style={{ borderRadius: 999 }}>{`${key}: ${value}`}</Tag>
                    ))}
                  </div>
                </div>
                <Button icon={<DeleteOutlined />} onClick={() => setItems(removeSavedSearch(item.id))} />
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                <Button type="primary" style={{ borderRadius: 12 }} onClick={() => { patchFilters(item.filters || {}); nav("/auto-market"); }}>
                  Shu qidiruvni ochish
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
