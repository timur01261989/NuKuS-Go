import React from "react";
import { Card, Button, Rate } from "antd";
import { PhoneOutlined, MessageOutlined, UserOutlined, EnvironmentOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import DealerTrustBadge from "./DealerTrustBadge";
const sellerCallIcon = "@/assets/auto-market/pro/seller/seller-call.svg";
const sellerRouteIcon = "@/assets/auto-market/pro/seller/seller-route.svg";
import { buildPremiumSellerAssist } from "../../services/autoMarketPremium";
import { buildLuxurySellerSurface } from "../../services/autoMarketLuxury";
import { buildSellerConciergeActions } from "../../services/autoMarketShowroom";
import { getLocalPaymentProviders } from "../../services/autoMarketLocalPayments";

export default function SellerProfile({ seller, onChat }) {
  const nav = useNavigate();
  const s = seller || {};
  const isDealer = (s?.seller_type || s?.type) === "dealer";
  const assist = buildPremiumSellerAssist(s);
  const luxurySurface = buildLuxurySellerSurface(s);
  const conciergeActions = buildSellerConciergeActions(s);
  const localProviders = getLocalPaymentProviders();

  return (
    <Card style={{ borderRadius: 20, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 18px 34px rgba(2,6,23,.05)" }} styles={{ body: { padding: 16 } }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{
          width: 52, height: 52, borderRadius: 18,
          background: "linear-gradient(135deg,#0ea5e9,#22c55e)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontWeight: 900,
          boxShadow: "0 14px 30px rgba(14,165,233,.18)"
        }}>
          <UserOutlined />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 900, color: "#0f172a", fontSize: 16 }}>{s.name || "Sotuvchi"}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
            <Rate disabled allowHalf defaultValue={Number(s?.rating || 4.7)} style={{ fontSize: 14 }} />
            <span style={{ fontSize: 12, color: "#64748b" }}>{isDealer ? "Diler" : "Shaxsiy sotuvchi"}</span>
          </div>
        </div>
        <DealerTrustBadge seller={s} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginTop: 14 }}>
        {assist.map((item) => (
          <div key={item.key} style={{ borderRadius: 16, padding: 12, border: `1px solid ${item.tone}22`, background: `${item.tone}10` }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: "#0f172a" }}>{item.title}</div>
            <div style={{ marginTop: 6, fontSize: 12, color: "#475569" }}>{item.text}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginTop: 14 }}>
        {luxurySurface.map((item) => (
          <div key={item.key} style={{ borderRadius: 16, padding: 12, border: `1px solid ${item.tone}22`, background: `${item.tone}10` }}>
            <div style={{ fontWeight: 800, color: "#0f172a", fontSize: 13 }}>{item.title}</div>
            <div style={{ marginTop: 6, fontSize: 12, color: "#475569" }}>{item.text}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 14, fontWeight: 800, color: "#0f172a" }}>Xaridor uchun qulay aloqa</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10, marginTop: 16 }}>
        <Button icon={<PhoneOutlined />} size="large" style={{ borderRadius: 14, height: 44 }} href={s?.phone ? `tel:${s.phone}` : undefined}>Qo'ng'iroq</Button>
        <Button icon={<MessageOutlined />} size="large" style={{ borderRadius: 14, height: 44 }} onClick={onChat}>Chat</Button>
        <Button icon={<EnvironmentOutlined />} size="large" style={{ borderRadius: 14, height: 44 }}>
          Manzil
        </Button>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 14, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
          <img src={sellerCallIcon} alt="" style={{ width: 16, height: 16 }} />
          <span style={{ fontSize: 12, color: "#475569" }}>Tez aloqa</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 14, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
          <img src={sellerRouteIcon} alt="" style={{ width: 16, height: 16 }} />
          <span style={{ fontSize: 12, color: "#475569" }}>Ko'rish joyi</span>
        </div>
      </div>

      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10 }}>
        <Button style={{ borderRadius: 14, height: 44 }} onClick={() => nav(`/auto-market/dealer/${s?.id || s?.seller_id || "seller-main"}`)}>Dealer profili</Button>
        <Button style={{ borderRadius: 14, height: 44 }} onClick={() => nav("/auto-market/notifications")}>Bildirishnomalar</Button>
        <Button type="primary" style={{ borderRadius: 14, height: 44, background: "#0f172a", border: "none" }} onClick={() => nav(`/auto-market/finance-offers/${s?.featuredAdId || s?.adId || "preview"}`)}>Finance offers</Button>
      </div>
    </Card>
  );
}
