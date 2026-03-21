import React, { useEffect, useMemo } from "react";
import { Button, Tag } from "antd";
import { ArrowLeftOutlined, CheckCircleOutlined, ReloadOutlined } from "@ant-design/icons";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import useCarDetails from "../hooks/useCarDetails";
import {
  buildBookingCheckout,
  buildCheckoutReceipt,
  getCheckoutProviders,
} from "../services/autoMarketBookingCheckout";
import {
  buildPaymentReceipt,
  buildPaymentRetryOptions,
  buildPaymentStatusTimeline,
  savePaymentEvent,
} from "../services/autoMarketLocalPayments";
import { buildQrAssistCards } from "../services/autoMarketExtendedSignals";

export default function PaymentReceiptPage() {
  const nav = useNavigate();
  const { id } = useParams();
  const [search] = useSearchParams();
  const { car, loading } = useCarDetails(id);

  const state = useMemo(() => ({
    day: search.get("day") || "today",
    slot: search.get("slot") || "today-16",
    provider: search.get("provider") || "click",
    service: search.get("service") || "reservation",
    status: search.get("status") || "pending",
  }), [search]);

  const providerMap = useMemo(
    () => Object.fromEntries(getCheckoutProviders().map((item) => [item.key, item])),
    [],
  );

  const checkout = useMemo(() => buildBookingCheckout(car || {}, state), [car, state]);
  const receipt = useMemo(() => buildCheckoutReceipt(car || {}, state), [car, state]);
  const paymentReceipt = useMemo(() => buildPaymentReceipt(car || {}, state), [car, state]);
  const retryOptions = useMemo(() => buildPaymentRetryOptions(state.provider), [state.provider]);
  const timeline = useMemo(() => buildPaymentStatusTimeline(state.status, state.provider), [state.status, state.provider]);

  useEffect(() => {
    if (!car) return;
    savePaymentEvent(car, { ...state, amount: receipt?.amount || paymentReceipt?.amount || 0 });
  }, [car, state, receipt, paymentReceipt]);

  return (
    <div style={{ padding: "14px 14px 100px", background: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 20 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => nav(-1)} style={{ borderRadius: 14 }} />
        <div>
          <div style={{ fontWeight: 950, fontSize: 20, color: "#0f172a" }}>Booking receipt va to‘lov holati</div>
          <div style={{ fontSize: 12, color: "#64748b" }}>Checkout yakuni, status, receipt va retry variantlari shu yerda ko‘rinadi.</div>
        </div>
      </div>

      {loading || !car ? (
        <div style={{ borderRadius: 20, padding: 24, background: "#fff", border: "1px solid #e2e8f0" }}>Yuklanmoqda...</div>
      ) : (
        <>
          <div style={{ borderRadius: 24, background: "#fff", border: "1px solid #e2e8f0", padding: 18, boxShadow: "0 16px 36px rgba(15,23,42,.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontWeight: 950, color: "#0f172a", fontSize: 18 }}>{paymentReceipt.title}</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>{paymentReceipt.text}</div>
              </div>
              <Tag color={state.status === "paid" ? "green" : state.status === "failed" ? "red" : "gold"} style={{ borderRadius: 999, paddingInline: 12, margin: 0 }}>
                {paymentReceipt.statusLabel}
              </Tag>
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
              {timeline.map((item) => (
                <div key={item.key} style={{ borderRadius: 16, padding: 14, border: `1px solid ${item.tone}22`, background: `${item.tone}10`, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontWeight: 900, color: "#0f172a" }}>{item.title}</div>
                    <div style={{ marginTop: 6, fontSize: 12, color: "#475569" }}>{item.text}</div>
                  </div>
                  <div style={{ fontWeight: 800, color: "#0f172a" }}>{item.state}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
              {paymentReceipt.lines.map((item) => (
                <div key={item.key} style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", borderRadius: 16, background: "#f8fafc", border: "1px solid #e2e8f0", padding: 14 }}>
                  <div>
                    <div style={{ fontWeight: 800, color: "#0f172a" }}>{item.label}</div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{item.text}</div>
                  </div>
                  <div style={{ fontWeight: 900, color: "#0f172a" }}>{item.value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginTop: 16 }}>
              {receipt.map((item) => (
                <div key={item.key} style={{ borderRadius: 16, padding: 14, border: "1px solid #e2e8f0", background: "#fff" }}>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{item.label}</div>
                  <div style={{ marginTop: 6, fontWeight: 800, color: "#0f172a" }}>{item.value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
              <Button type="primary" icon={<CheckCircleOutlined />} style={{ borderRadius: 14, background: "#0f172a", border: "none" }} onClick={() => nav("/auto-market/notifications")}>
                Seller leads markaziga o‘tish · bildirishnomalar markaziga o‘tish
              </Button>
              <Button icon={<ReloadOutlined />} style={{ borderRadius: 14 }} onClick={() => nav(`/auto-market/booking/${id}/checkout`)}>
                Checkoutga qaytish
              </Button>
            </div>
          </div>


          <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
            {qrAssist.map((item) => (
              <div key={item.key} style={{ borderRadius: 18, border: "1px solid #e2e8f0", background: "#fff", padding: 14 }}>
                {item.asset ? <img src={item.asset} alt={item.title} style={{ width: 42, height: 42, objectFit: "contain", marginBottom: 10 }} /> : null}
                <div style={{ fontWeight: 900, color: "#0f172a" }}>{item.title}</div>
                <div style={{ marginTop: 6, fontSize: 12, color: "#475569" }}>{item.note}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
            {retryOptions.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => nav(`/auto-market/booking/${id}/receipt?day=${state.day}&slot=${state.slot}&service=${state.service}&provider=${item.key}&status=pending`)}
                style={{ borderRadius: 18, padding: 14, border: `1px solid ${item.tone}22`, background: `${item.tone}10`, textAlign: "left", cursor: "pointer" }}
              >
                <div style={{ fontWeight: 900, color: "#0f172a" }}>{item.title}</div>
                <div style={{ marginTop: 6, fontSize: 12, color: "#475569" }}>{item.text}</div>
                <div style={{ marginTop: 8, fontSize: 11, color: "#64748b" }}>{providerMap[item.key]?.title || item.key}</div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
