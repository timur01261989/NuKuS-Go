
import React, { useEffect, useMemo, useState } from "react";
import { Button, Tag, message } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { myAds } from "../services/marketBackend";
import {
  buildSellerLeads,
  buildLeadsOverview,
  filterLeadsByStage,
  getLeadStages,
  buildLeadPipelineGuide,
  enrichLeadForCrm,
} from "../services/autoMarketLeads";
import SellerLeadCard from "../components/Seller/SellerLeadCard";
import { buildFollowUpGuide } from "../services/autoMarketSellerStudio";

export default function SellerLeadsPage() {
  const nav = useNavigate();
  const [items, setItems] = useState([]);
  const [stage, setStage] = useState("all");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await myAds();
        if (active) setItems(Array.isArray(data) ? data : []);
      } catch (error) {
        if (active) setItems([]);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const leads = useMemo(() => buildSellerLeads(items), [items]);
  const overview = useMemo(() => buildLeadsOverview(leads), [leads]);
  const visibleLeads = useMemo(() => filterLeadsByStage(leads, stage).map((lead, index) => enrichLeadForCrm(lead, index)), [leads, stage]);
  const stages = useMemo(() => [{ key: "all", title: "Barchasi", tone: "#0f172a" }, ...getLeadStages()], []);
  const guide = useMemo(() => buildLeadPipelineGuide(), []);

  return (
    <div style={{ padding: "14px 14px 100px", background: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 20 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => nav(-1)} style={{ borderRadius: 14 }} />
        <div>
          <div style={{ fontWeight: 950, fontSize: 20, color: "#0f172a" }}>Seller leads markazi</div>
          <div style={{ fontSize: 12, color: "#64748b" }}>Booking, qo‘ng‘iroq, chat va compare’dan kelgan qiziqishlar shu yerda boshqariladi.</div>
                  <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Button style={{ borderRadius: 12 }} onClick={() => nav("/auto-market/seller/appointments")}>Agenda</Button>
            <Button style={{ borderRadius: 12 }} onClick={() => nav("/auto-market/notifications")}>Bildirishnomalar</Button>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
        {overview.map((item) => (
          <div key={item.key} style={{ borderRadius: 18, padding: 14, border: `1px solid ${item.tone}22`, background: `${item.tone}10` }}>
            <div style={{ fontSize: 12, color: "#475569" }}>{item.label}</div>
            <div style={{ marginTop: 8, fontWeight: 950, color: "#0f172a", fontSize: 24 }}>{item.value}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
        {stages.map((item) => {
          const active = item.key === stage;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setStage(item.key)}
              style={{
                borderRadius: 999,
                border: active ? "1px solid #0f172a" : "1px solid #e2e8f0",
                background: active ? "#0f172a" : "#fff",
                color: active ? "#fff" : "#0f172a",
                padding: "10px 14px",
                cursor: "pointer",
                fontWeight: 800,
              }}
            >
              {item.title}
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
        {guide.map((item) => (
          <div key={item.key} style={{ borderRadius: 18, padding: 14, border: `1px solid ${item.tone}22`, background: `${item.tone}10` }}>
            <div style={{ fontWeight: 900, color: "#0f172a" }}>{item.title}</div>
            <div style={{ fontSize: 12, color: "#475569", marginTop: 6 }}>{item.text}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 18, display: "grid", gap: 12 }}>
        {visibleLeads.map((lead) => (
          <SellerLeadCard
            key={lead.key}
            lead={lead}
            onCall={() => message.info("Lead bo‘yicha qo‘ng‘iroq tayyor")}
            onChat={() => message.info("Lead bo‘yicha chat ochiladi")}
            onConfirm={() => message.success("Lead keyingi bosqichga o‘tkazildi")}
            onReschedule={() => message.info("Lead uchun yangi slot tanlanadi")}
          />
        ))}
      </div>

      <div style={{ marginTop: 18, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Tag color="blue" style={{ borderRadius: 999, paddingInline: 12 }}>Lead source tracking</Tag>
        <Tag color="green" style={{ borderRadius: 999, paddingInline: 12 }}>Booking pipeline</Tag>
        <Tag color="purple" style={{ borderRadius: 999, paddingInline: 12 }}>Follow-up agenda</Tag>
      </div>
    </div>
  );
}
