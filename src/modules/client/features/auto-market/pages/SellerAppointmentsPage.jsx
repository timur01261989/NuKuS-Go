
import React, { useEffect, useMemo, useState } from "react";
import { Button, message } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { myAds } from "../services/marketBackend";
import { buildSellerInsights } from "../services/autoMarketSellerStudio";
import { buildSellerLeads, enrichLeadForCrm } from "../services/autoMarketLeads";

export default function SellerAppointmentsPage() {
  const nav = useNavigate();
  const [items, setItems] = useState([]);

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

  const [status, setStatus] = useState("all");
  const leads = useMemo(() => buildSellerLeads(items).slice(0, 8).map((lead, index) => enrichLeadForCrm(lead, index)), [items]);
  const appointmentGroups = useMemo(() => ([
    { key: "all", title: "Barchasi" },
    { key: "new", title: "Yangi" },
    { key: "scheduled", title: "Tasdiqlangan" },
    { key: "reserved", title: "Bron qilingan" },
  ]), []);
  const visibleLeads = useMemo(() => status === "all" ? leads : leads.filter((lead) => lead.stage === status), [leads, status]);

  return (
    <div style={{ padding: "14px 14px 100px", background: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 20 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => nav(-1)} style={{ borderRadius: 14 }} />
        <div>
          <div style={{ fontWeight: 950, fontSize: 20, color: "#0f172a" }}>Seller agenda va bookinglar</div>
          <div style={{ fontSize: 12, color: "#64748b" }}>Tasdiqlangan ko‘rishlar, test drive va ko‘rik slotlari shu yerda turadi.</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <Button style={{ borderRadius: 12 }} onClick={() => nav("/auto-market/seller/leads")}>Leadlar</Button>
        <Button style={{ borderRadius: 12 }} onClick={() => nav("/auto-market/notifications")}>Bildirishnomalar</Button>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {appointmentGroups.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setStatus(item.key)}
            style={{ borderRadius: 999, border: status === item.key ? "1px solid #0f172a" : "1px solid #e2e8f0", background: status === item.key ? "#0f172a" : "#fff", color: status === item.key ? "#fff" : "#0f172a", padding: "10px 14px", cursor: "pointer", fontWeight: 800 }}
          >
            {item.title}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12, marginBottom: 16 }}>
        {insights.map((item) => (
          <div key={item.key} style={{ borderRadius: 18, padding: 14, background: "#fff", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 12, color: "#64748b" }}>{item.title}</div>
            <div style={{ marginTop: 8, fontWeight: 950, fontSize: 20, color: item.tone }}>{item.value}</div>
            <div style={{ marginTop: 6, fontSize: 12, color: "#475569" }}>{item.text}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {visibleLeads.map((lead) => (
          <div key={lead.key} style={{ borderRadius: 20, background: "#fff", border: "1px solid #e2e8f0", padding: 16, boxShadow: "0 12px 28px rgba(15,23,42,.04)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontWeight: 900, color: "#0f172a" }}>{lead.vehicle}</div>
                <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>{lead.customer} · {lead.appointment}</div>
              </div>
              <div style={{ fontWeight: 800, color: "#0f172a" }}>{lead.stageTitle}</div>
            </div>
            <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Button style={{ borderRadius: 12 }} onClick={() => message.success("Appointment tasdiqlandi")}>Tasdiqlash</Button>
              <Button style={{ borderRadius: 12 }} onClick={() => message.info("Appointment ko‘chirildi")}>Ko‘chirish</Button>
              <Button style={{ borderRadius: 12 }} onClick={() => message.info("Reminder yuborildi")}>Reminder</Button>
              <Button style={{ borderRadius: 12 }} onClick={() => message.success("Receipt qayta yuborildi")}>Receipt yuborish</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
