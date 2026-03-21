import React from "react";
import { Card, Button, Tag } from "antd";
import { CalendarOutlined, CarOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { buildBookingFlow, buildBookingActions } from "../../services/autoMarketBooking";

const ICONS = {
  showroom: <CalendarOutlined />,
  "test-drive": <CarOutlined />,
  inspection: <SafetyCertificateOutlined />,
};

export default function BookingFlowCard({ ad, seller, onReserve, onSchedule }) {
  const flow = buildBookingFlow(ad, seller);
  const actions = buildBookingActions(ad, seller);

  return (
    <Card style={{ borderRadius: 22, border: "1px solid #e2e8f0", boxShadow: "0 16px 36px rgba(15,23,42,.05)" }} styles={{ body: { padding: 16 } }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontWeight: 900, color: "#0f172a", fontSize: 18 }}>Booking va uchrashuv markazi</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>Ko‘rish, test drive va ekspert ko‘rigi uchun bir necha tayyor vaqt slotlari.</div>
        </div>
        <Tag color="blue" style={{ borderRadius: 999, paddingInline: 12, margin: 0 }}>{flow.city}</Tag>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginTop: 14 }}>
        {flow.steps.map((step) => (
          <div key={step.key} style={{ borderRadius: 18, padding: 14, border: `1px solid ${step.tone}22`, background: `${step.tone}10` }}>
            <div style={{ fontWeight: 800, color: "#0f172a" }}>{step.title}</div>
            <div style={{ fontSize: 12, color: "#475569", marginTop: 6, lineHeight: 1.55 }}>{step.text}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 10, marginTop: 14 }}>
        {flow.slots.map((slot) => (
          <div key={slot.key} style={{ borderRadius: 18, padding: 14, border: `1px solid ${slot.tone}22`, background: `${slot.tone}10` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, color: "#0f172a" }}>
              {ICONS[slot.type] || <CalendarOutlined />} {slot.label}
            </div>
            <div style={{ marginTop: 6, fontSize: 12, color: "#475569" }}>{slot.note}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 10, marginTop: 14 }}>
        {actions.map((item) => (
          <div key={item.key} style={{ borderRadius: 18, padding: 14, border: `1px solid ${item.tone}22`, background: `${item.tone}10` }}>
            <div style={{ fontWeight: 900, color: "#0f172a" }}>{item.title}</div>
            <div style={{ fontSize: 12, color: "#475569", marginTop: 6, lineHeight: 1.55 }}>{item.text}</div>
            <div style={{ marginTop: 10, fontWeight: 800, color: "#0f172a" }}>{item.amount ? `${item.amount.toLocaleString("ru-RU")} so‘m` : "Bepul band qilish"}</div>
            <div style={{ marginTop: 4, fontSize: 11, color: "#64748b" }}>{item.providerHint}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
        <Button type="primary" style={{ borderRadius: 14, background: "#0f172a", border: "none" }} onClick={onSchedule}>Ko‘rish vaqtini tanlash</Button>
        <Button style={{ borderRadius: 14 }} onClick={onReserve}>Bron qilish</Button>
      </div>
    </Card>
  );
}
