
import React from "react";
import { Card, Button, Tag } from "antd";
import AppointmentCalendar from "./AppointmentCalendar";
import SlotPicker from "./SlotPicker";
import {
  buildBookingCheckout,
  buildBookingSuccessNote,
  buildCheckoutReceipt,
  getCheckoutProviders,
  getBookingCalendar,
  getCheckoutSlotMap,
  getCheckoutServices,
} from "../../services/autoMarketBookingCheckout";
import { buildPaymentStatusTimeline } from "../../services/autoMarketLocalPayments";

export default function BookingCheckoutCard({
  ad,
  state,
  onSelectDay,
  onSelectSlot,
  onSelectProvider,
  onSelectService,
  onConfirm,
}) {
  const checkout = buildBookingCheckout(ad, state);
  const success = buildBookingSuccessNote(ad);
  const receipt = buildCheckoutReceipt(ad, state);
  const providers = getCheckoutProviders();
  const calendar = getBookingCalendar(ad);
  const slotMap = getCheckoutSlotMap(ad);
  const services = getCheckoutServices();
  const slots = slotMap[state?.day || "today"] || [];
  const paymentTimeline = buildPaymentStatusTimeline("pending", state?.provider || "click");

  return (
    <Card style={{ borderRadius: 24, border: "1px solid #e2e8f0", boxShadow: "0 18px 40px rgba(15,23,42,.06)" }} bodyStyle={{ padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontWeight: 950, color: "#0f172a", fontSize: 18 }}>{checkout.title}</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>{checkout.text}</div>
        </div>
        <Tag color="geekblue" style={{ borderRadius: 999, paddingInline: 12, margin: 0 }}>Click · Payme · Humo · Uzcard</Tag>
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={{ fontWeight: 900, color: "#0f172a", marginBottom: 10 }}>1. Kunni tanlang</div>
        <AppointmentCalendar days={calendar} selectedDay={state?.day} onSelectDay={onSelectDay} />
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={{ fontWeight: 900, color: "#0f172a", marginBottom: 10 }}>2. Slotni tanlang</div>
        <SlotPicker slots={slots} selectedSlot={state?.slot} onSelectSlot={onSelectSlot} />
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={{ fontWeight: 900, color: "#0f172a", marginBottom: 10 }}>3. Xizmat turini tanlang</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
          {services.map((item) => {
            const active = item.key === state?.service;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onSelectService?.(item.key)}
                style={{
                  borderRadius: 18,
                  padding: 14,
                  border: active ? `1px solid ${item.tone}` : "1px solid #e2e8f0",
                  background: active ? `${item.tone}14` : "#fff",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <div style={{ fontWeight: 900, color: "#0f172a" }}>{item.title}</div>
                <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>{item.text}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={{ fontWeight: 900, color: "#0f172a", marginBottom: 10 }}>4. To‘lov usulini tanlang</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
          {providers.map((item) => {
            const active = item.key === state?.provider;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onSelectProvider?.(item.key)}
                style={{
                  borderRadius: 18,
                  padding: 14,
                  border: active ? `1px solid ${item.tone}` : "1px solid #e2e8f0",
                  background: active ? `${item.tone}14` : "#fff",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <div style={{ fontWeight: 900, color: "#0f172a" }}>{item.title}</div>
                <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>{item.text}</div>
              </button>
            );
          })}
        </div>
      </div>


      <div style={{ marginTop: 16 }}>
        <div style={{ fontWeight: 900, color: "#0f172a", marginBottom: 10 }}>5. Payment va receipt holati</div>
        <div style={{ display: "grid", gap: 10 }}>
          {paymentTimeline.map((item) => (
            <div key={item.key} style={{ borderRadius: 16, padding: 14, border: `1px solid ${item.tone}22`, background: `${item.tone}10`, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontWeight: 900, color: "#0f172a" }}>{item.title}</div>
                <div style={{ marginTop: 6, fontSize: 12, color: "#475569" }}>{item.text}</div>
              </div>
              <div style={{ fontWeight: 800, color: "#0f172a" }}>{item.state}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 10, marginTop: 16 }}>
        {checkout.summary.map((item) => (
          <div key={item.key} style={{ borderRadius: 18, padding: 14, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 12, color: "#64748b" }}>{item.label}</div>
            <div style={{ marginTop: 8, fontWeight: 900, color: "#0f172a" }}>{item.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
        {checkout.breakdown.map((item) => (
          <div key={item.key} style={{ display: "flex", justifyContent: "space-between", gap: 10, borderRadius: 16, padding: 12, border: "1px solid #e2e8f0", background: "#fff" }}>
            <div>
              <div style={{ fontWeight: 800, color: "#0f172a" }}>{item.label}</div>
              {item.text ? <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>{item.text}</div> : null}
            </div>
            <div style={{ fontWeight: 900, color: "#0f172a" }}>{typeof item.amount === "number" ? `${item.amount.toLocaleString("ru-RU")} so‘m` : ""}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 14, borderRadius: 18, padding: 14, background: "#0f172a", color: "#fff" }}>
        <div style={{ fontSize: 12, opacity: .8 }}>Yakuniy summa</div>
        <div style={{ marginTop: 8, fontSize: 24, fontWeight: 950 }}>{checkout.total.toLocaleString("ru-RU")} so‘m</div>
        <div style={{ marginTop: 8, fontSize: 12, opacity: .8 }}>{success.text}</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginTop: 14 }}>
        {receipt.map((item) => (
          <div key={item.key} style={{ borderRadius: 16, padding: 12, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 12, color: "#64748b" }}>{item.label}</div>
            <div style={{ fontWeight: 900, color: "#0f172a", marginTop: 6 }}>{item.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
        <Button type="primary" style={{ borderRadius: 14, background: "#0f172a", border: "none" }} onClick={() => onConfirm?.(state)}>{checkout.ctaLabel}</Button>
      </div>
    </Card>
  );
}
