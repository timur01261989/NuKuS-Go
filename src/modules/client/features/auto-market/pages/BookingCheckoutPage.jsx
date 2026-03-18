
import React, { useState } from "react";
import { Button, message } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import useCarDetails from "../hooks/useCarDetails";
import BookingCheckoutCard from "../components/Details/BookingCheckoutCard";
import { saveBookingEvent } from "../services/autoMarketBookingCheckout";

export default function BookingCheckoutPage() {
  const nav = useNavigate();
  const { id } = useParams();
  const { car, loading } = useCarDetails(id);
  const [state, setState] = useState({
    day: "today",
    slot: "today-16",
    provider: "click",
    service: "reservation",
  });

  return (
    <div style={{ padding: "14px 14px 100px", background: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 20 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => nav(-1)} style={{ borderRadius: 14 }} />
        <div>
          <div style={{ fontWeight: 950, fontSize: 20, color: "#0f172a" }}>Booking checkout</div>
          <div style={{ fontSize: 12, color: "#64748b" }}>Bron, ko‘rish va test drive tasdig‘i shu yerda yakunlanadi.</div>
        </div>
      </div>

      {loading || !car ? (
        <div style={{ borderRadius: 20, padding: 24, background: "#fff", border: "1px solid #e2e8f0" }}>Yuklanmoqda...</div>
      ) : (
        <BookingCheckoutCard
          ad={car}
          state={state}
          onSelectDay={(day) => setState((prev) => ({ ...prev, day, slot: day === "today" ? "today-16" : day === "tomorrow" ? "tomorrow-14" : "weekend-12" }))}
          onSelectSlot={(slot) => setState((prev) => ({ ...prev, slot }))}
          onSelectProvider={(provider) => setState((prev) => ({ ...prev, provider }))}
          onSelectService={(service) => setState((prev) => ({ ...prev, service }))}
          onConfirm={(nextState) => {
            const persisted = saveBookingEvent(car, { ...(nextState || state), status: "pending" });
            message.success("Booking checkout yakunlandi, receipt va seller pipeline yangilandi");
            const query = new URLSearchParams({
              day: nextState?.day || state.day,
              slot: nextState?.slot || state.slot,
              provider: nextState?.provider || state.provider,
              service: nextState?.service || state.service,
              status: "pending",
              amount: String(persisted?.amount || ""),
            }).toString();
            nav(`/auto-market/booking/${id}/receipt?${query}`);
          }}
        />
      )}
    </div>
  );
}
