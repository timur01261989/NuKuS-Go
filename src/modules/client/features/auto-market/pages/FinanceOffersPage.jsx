import React, { useMemo, useState } from "react";
import { Button, Card, Tag, Segmented } from "antd";
import { ArrowLeftOutlined, CreditCardOutlined, CalculatorOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import useCarDetails from "../hooks/useCarDetails";
import { buildFinanceOffers, buildFinanceCalculator } from "../services/autoMarketMarketplaceFinal";
import { buildFinanceActionDeck } from "../services/autoMarketFinalPolish";

export default function FinanceOffersPage() {
  const nav = useNavigate();
  const { id } = useParams();
  const { car } = useCarDetails(id);
  const baseCar = car || { id, price: 285000000 };
  const [duration, setDuration] = useState(24);
  const [downShare, setDownShare] = useState(0.25);
  const offers = buildFinanceOffers(baseCar);
  const financeActionDeck = useMemo(() => buildFinanceActionDeck(baseCar), [baseCar]);
  const calc = useMemo(() => buildFinanceCalculator(baseCar, {
    downPayment: Math.round(Number(baseCar.price || 0) * downShare),
    duration,
    annualRate: 26,
  }), [baseCar, downShare, duration]);

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", paddingBottom: 120 }}>
      <div style={{ position: "sticky", top: 0, zIndex: 20, background: "#fff", padding: "12px 16px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 12 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => nav(-1)} />
        <div>
          <div style={{ fontWeight: 900, color: "#0f172a" }}>Finance offers</div>
          <div style={{ fontSize: 12, color: "#64748b" }}>Mahalliy to‘lov, moliyalash va finance calculator</div>
        </div>
      </div>

      <div style={{ padding: 16, display: "grid", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
          {financeActionDeck.map((item) => (
            <Card key={item.key} style={{ borderRadius: 22, border: "1px solid #e2e8f0" }}>
              <div style={{ fontWeight: 900, color: "#0f172a" }}>{item.title}</div>
              <div style={{ marginTop: 6, color: "#475569" }}>{item.text}</div>
              <Button onClick={() => nav(item.route)} style={{ borderRadius: 14, marginTop: 12 }}>
                Ochish
              </Button>
            </Card>
          ))}
        </div>

        <Card style={{ borderRadius: 24, border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <CalculatorOutlined style={{ color: "#ef4444" }} />
            <div style={{ fontWeight: 900, color: "#0f172a" }}>Finance calculator</div>
          </div>
          <div style={{ marginTop: 12, color: "#475569" }}>Boshlang‘ich to‘lov va muddatni tanlab, oyma-oy rejani ko‘ring.</div>

          <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>Muddat</div>
              <Segmented
                block
                value={String(duration)}
                onChange={(val) => setDuration(Number(val))}
                options={calc.durations.map((item) => ({ label: item.title, value: item.key }))}
              />
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>Boshlang‘ich to‘lov</div>
              <Segmented
                block
                value={String(downShare)}
                onChange={(val) => setDownShare(Number(val))}
                options={calc.downPaymentOptions.map((item) => ({ label: item.title, value: item.key }))}
              />
            </div>
          </div>

          <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
            {calc.summary.map((item) => (
              <div key={item.key} style={{ borderRadius: 18, background: "#f8fafc", padding: 14, border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 12, color: "#64748b" }}>{item.title}</div>
                <div style={{ marginTop: 8, fontWeight: 900, color: "#0f172a", fontSize: 18 }}>{item.value}</div>
              </div>
            ))}
          </div>
        </Card>

        {offers.map((offer) => (
          <Card key={offer.key} style={{ borderRadius: 24, border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#0f172a" }}>{offer.title}</div>
                <div style={{ marginTop: 8, color: "#475569" }}>{offer.note}</div>
              </div>
              <Tag color="blue" style={{ borderRadius: 999, margin: 0 }}>{offer.duration}</Tag>
            </div>
            <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
              <div style={{ borderRadius: 18, background: "#f8fafc", padding: 14, border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 12, color: "#64748b" }}>Boshlang‘ich to‘lov</div>
                <div style={{ marginTop: 8, fontWeight: 900, color: "#0f172a" }}>{offer.downPayment}</div>
              </div>
              <div style={{ borderRadius: 18, background: "#f8fafc", padding: 14, border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 12, color: "#64748b" }}>Oyma-oy</div>
                <div style={{ marginTop: 8, fontWeight: 900, color: "#0f172a" }}>{offer.monthly}</div>
              </div>
            </div>
            <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Button type="primary" icon={<CreditCardOutlined />} onClick={() => nav(offer.route)} style={{ borderRadius: 14 }}>
                Checkoutni ochish
              </Button>
              <Button onClick={() => nav(`/auto-market/notifications/rules`)} style={{ borderRadius: 14 }}>
                Finance rulelari
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
