import React, { useEffect, useState } from "react";
import { Button, Spin, Table, Tag } from "antd";
import { ArrowLeftOutlined, DeleteOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useCompare } from "../context/CompareContext";
import { getCarById } from "../services/marketBackend";
import { formatPrice } from "../services/priceUtils";
import { buildCompareHighlights } from "../services/autoMarketDecisionSupport";
import { buildLuxuryDecisionRibbon } from "../services/autoMarketLuxury";
import { buildShowroomConciergeDeck } from "../services/autoMarketShowroom";
import { buildCompareWinner, saveAlertDraft } from "../services/autoMarketBuyerCore";
import { useAutoMarketI18n } from "../utils/useAutoMarketI18n";
import { buildCompareAssistRail } from "../services/autoMarketExtendedSignals";

export default function ComparePage() {
  const { am } = useAutoMarketI18n();
  const nav = useNavigate();
  const { ids, remove, clear } = useCompare();
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(false);
  const compareAssist = buildCompareAssistRail(cars);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await Promise.all(ids.map(id => getCarById(id)));
        if (mounted) setCars(res);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [ids]);


  const compareHighlights = buildCompareHighlights(cars);
  const luxuryDecisionRibbon = buildLuxuryDecisionRibbon(cars);
  const conciergeDeck = buildShowroomConciergeDeck(cars);
  const compareWinner = buildCompareWinner(cars);

  const rows = [
    { key: "brand", name: am("compare.brand"), v: (c) => c.brand },
    { key: "model", name: am("compare.model"), v: (c) => c.model },
    { key: "year", name: am("compare.year"), v: (c) => c.year },
    { key: "mileage", name: am("compare.mileage"), v: (c) => (c.mileage ?? "-") + " km" },
    { key: "engine", name: am("compare.engine"), v: (c) => c.engine },
    { key: "fuel", name: am("compare.fuel"), v: (c) => c.fuel_type },
    { key: "trans", name: am("compare.trans"), v: (c) => c.transmission },
    { key: "price", name: am("compare.price"), v: (c) => formatPrice(c.price, c.currency) },
    { key: "city", name: am("compare.city"), v: (c) => c.city },
  ];

  return (
    <div style={{ padding: 14, paddingBottom: 60 }}>
      <div style={{ display:"flex", gap: 10, alignItems:"center", marginBottom: 12 }}>

        <Button icon={<ArrowLeftOutlined />} onClick={()=>nav(-1)} style={{ borderRadius: 14 }} />
        <div style={{ fontWeight: 950, fontSize: 18, color:"#0f172a", flex:1 }}>{am("compare.title")}</div>
        <Button icon={<DeleteOutlined />} onClick={clear} danger style={{ borderRadius: 12 }}>Tozalash</Button>
      </div>

      {loading ? <div style={{ display:"flex", justifyContent:"center", padding: 30 }}><Spin /></div> : null}

      {!loading && !ids.length ? (
        <div style={{ color:"#64748b", fontWeight: 800 }}>{am("app.emptyCompare")}</div>
      ) : null}

      {!loading && compareWinner ? (
        <div style={{ marginBottom: 12, borderRadius: 18, border: "1px solid #dcfce7", background: "#f0fdf4", padding: 14 }}>
          <div style={{ fontWeight: 900, color: "#166534" }}>Eng qulay variant: {compareWinner.title}</div>
          <div style={{ fontSize: 12, color: "#166534", marginTop: 6 }}>{compareWinner.text}</div>
        </div>
      ) : null}

      {!loading && luxuryDecisionRibbon.length ? (
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginBottom: 12 }}>
          {luxuryDecisionRibbon.map((item) => (
            <div key={item.key} style={{ borderRadius: 18, padding: 14, border: `1px solid ${item.tone}22`, background: `${item.tone}10` }}>
              <div style={{ fontSize: 12, color: "#64748b" }}>{item.label}</div>
              <div style={{ marginTop: 8, fontWeight: 900, color: "#0f172a" }}>{item.value || "Tanlanmoqda"}</div>
            </div>
          ))}
        </div>
      ) : null}

      {!loading && compareHighlights.cards.length ? (
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginBottom: 14 }}>
          {compareHighlights.cards.map((card) => (
            <div key={card.key} style={{ borderRadius: 18, padding: 14, border: `1px solid ${card.tone}25`, background: `${card.tone}10` }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                <div style={{ fontWeight: 900, color: "#0f172a" }}>{card.title}</div>
                <Tag color={card.carId === compareHighlights.bestValueId ? "green" : "blue"} style={{ borderRadius: 999 }}>
                  {card.carId === compareHighlights.bestValueId ? "Eng qulay variant" : card.badge}
                </Tag>
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>{card.text}</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: card.tone, marginTop: 8 }}>{card.subtitle}</div>
            </div>
          ))}
        </div>
      ) : null}

      {!loading && ids.length ? (
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"separate", borderSpacing:"0 10px" }}>
            <thead>
              <tr>
                <th style={{ textAlign:"left", color:"#64748b", fontSize: 12, padding: 8 }}>{am("compare.param")}</th>
                {cars.map(c => (
                  <th key={c.id} style={{ textAlign:"left", padding: 8 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap: 10 }}>
                      <div style={{ fontWeight: 900, color:"#0f172a" }}>{c.brand} {c.model}</div>
                      <Button size="small" onClick={()=>remove(c.id)} style={{ borderRadius: 999 }}>X</Button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.key} style={{ background:"#fff", border:"1px solid #e2e8f0" }}>
                  <td style={{ padding: 10, fontWeight: 900, color:"#0f172a", borderTopLeftRadius: 14, borderBottomLeftRadius: 14, border:"1px solid #e2e8f0" }}>{r.name}</td>
                  {cars.map(c => (
                    <td key={c.id + r.key} style={{ padding: 10, border:"1px solid #e2e8f0" }}>{r.v(c)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
