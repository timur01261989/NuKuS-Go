import React from "react";
import { Card, Button } from "antd";
const calendarIcon = "@/assets/auto-market/pro/reservation/reservation-calendar.svg";
const callIcon = "@/assets/auto-market/pro/reservation/reservation-call.svg";
import reservationHero from "@/assets/auto-market/pro/reservation/reservation-hero-button.png";

export default function AppointmentBookingCard({ seller, onCall }) {
  return (
    <Card style={{ borderRadius: 20, border: "1px solid #e2e8f0", overflow: "hidden" }} styles={{ body: { padding: 16 } }}>
      <div style={{ display: "grid", gridTemplateColumns: "1.15fr .85fr", gap: 14, alignItems: "center" }}>
        <div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <img src={calendarIcon} alt="" style={{ width: 22, height: 22 }} />
            <div style={{ fontWeight: 900, color: "#0f172a" }}>Ko‘rish va uchrashuvni band qiling</div>
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>
            Xaridor mashinani ko‘rish vaqtini tanlaydi, sotuvchi esa bir bosishda tasdiqlaydi.
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <Button type="primary" style={{ borderRadius: 14, background: "#0f172a", border: "none" }}>Vaqt tanlash</Button>
            <Button icon={<img src={callIcon} alt="" style={{ width: 16, height: 16 }} />} style={{ borderRadius: 14 }} onClick={onCall}>Tez qo‘ng‘iroq</Button>
          </div>
        </div>
        <img src={reservationHero} alt="" style={{ width: "100%", maxWidth: 150, justifySelf: "end", objectFit: "contain" }} />
      </div>
    </Card>
  );
}