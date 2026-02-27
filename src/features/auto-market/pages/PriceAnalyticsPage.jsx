/**
 * PriceAnalyticsPage.jsx
 * Narxlar grafigi va bozor tahlili.
 * "Hozir olish yaхshi" yoki "Kuting, narx tushmoqda" indikatori.
 */
import React, { useState, useMemo } from "react";
import { Button, Select, Spin, Tag } from "antd";
import { ArrowLeftOutlined, LineChartOutlined, RiseOutlined, FallOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { BRANDS, MODELS_BY_BRAND } from "../services/staticData";

// Mock narx tarixiy ma'lumotlari (real loyihada Supabase'dan olinadi)
const PRICE_HISTORY = {
  "Chevrolet|Cobalt": [
    { month:"Yan 2025", avg:42000000 }, { month:"Fev 2025", avg:41500000 },
    { month:"Mar 2025", avg:43000000 }, { month:"Apr 2025", avg:42800000 },
    { month:"May 2025", avg:44000000 }, { month:"Iyn 2025", avg:43500000 },
    { month:"Iyl 2025", avg:45000000 }, { month:"Avg 2025", avg:44800000 },
    { month:"Sen 2025", avg:43200000 }, { month:"Okt 2025", avg:42500000 },
    { month:"Nov 2025", avg:41000000 }, { month:"Dek 2025", avg:40800000 },
    { month:"Yan 2026", avg:41500000 }, { month:"Fev 2026", avg:42000000 },
  ],
  "Chevrolet|Gentra": [
    { month:"Yan 2025", avg:53000000 }, { month:"Fev 2025", avg:52500000 },
    { month:"Mar 2025", avg:54000000 }, { month:"Apr 2025", avg:53800000 },
    { month:"May 2025", avg:55000000 }, { month:"Iyn 2025", avg:54200000 },
    { month:"Iyl 2025", avg:56000000 }, { month:"Avg 2025", avg:55800000 },
    { month:"Sen 2025", avg:54000000 }, { month:"Okt 2025", avg:53200000 },
    { month:"Nov 2025", avg:52000000 }, { month:"Dek 2025", avg:51800000 },
    { month:"Yan 2026", avg:52500000 }, { month:"Fev 2026", avg:53000000 },
  ],
  "KIA|K5": [
    { month:"Yan 2025", avg:175000000 }, { month:"Fev 2025", avg:178000000 },
    { month:"Mar 2025", avg:180000000 }, { month:"Apr 2025", avg:182000000 },
    { month:"May 2025", avg:185000000 }, { month:"Iyn 2025", avg:183000000 },
    { month:"Iyl 2025", avg:186000000 }, { month:"Avg 2025", avg:188000000 },
    { month:"Sen 2025", avg:190000000 }, { month:"Okt 2025", avg:192000000 },
    { month:"Nov 2025", avg:195000000 }, { month:"Dek 2025", avg:198000000 },
    { month:"Yan 2026", avg:200000000 }, { month:"Fev 2026", avg:202000000 },
  ],
};

function MiniChart({ data, color = "#0ea5e9" }) {
  if (!data || data.length < 2) return null;
  const W = 300, H = 100, PAD = 16;
  const prices = data.map(d => d.avg);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const span = maxP - minP || 1;
  const pts = prices.map((p, i) => {
    const x = PAD + (i * (W - PAD * 2)) / (prices.length - 1);
    const y = H - PAD - ((p - minP) * (H - PAD * 2)) / span;
    return [x, y];
  });
  const d = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(" ");
  const area = `${d} L${W-PAD},${H-PAD} L${PAD},${H-PAD} Z`;
  const last = pts[pts.length - 1];
  const prev = pts[pts.length - 2];

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display:"block" }}>
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#grad)" />
      <path d={d} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={i === pts.length-1 ? 5 : 3}
          fill={i === pts.length-1 ? color : "#fff"} stroke={color} strokeWidth="2" />
      ))}
      {/* X labels - faqat birinchi, o'rta va oxirgi */}
      {[0, Math.floor(prices.length/2), prices.length-1].map(i => (
        <text key={i} x={pts[i][0]} y={H-2} textAnchor="middle" fontSize="8" fill="#94a3b8">
          {data[i]?.month?.slice(0,3) || ""}
        </text>
      ))}
    </svg>
  );
}

function getAdvice(data) {
  if (!data || data.length < 3) return null;
  const prices = data.map(d => d.avg);
  const last3  = prices.slice(-3);
  const trend  = last3[2] - last3[0];
  const pct    = Math.round((Math.abs(trend) / last3[0]) * 100);
  if (trend < -last3[0] * 0.02) {
    return { text:`Narx tushmoqda (${pct}%). Kuting!`, color:"#ef4444", icon:"🔴", action:"wait" };
  } else if (trend > last3[0] * 0.02) {
    return { text:`Narx o'smoqda (${pct}%). Hozir olish foydali!`, color:"#16a34a", icon:"🟢", action:"buy" };
  } else {
    return { text:"Narx barqaror. Xohlagan vaqtda olsangiz bo'ladi.", color:"#ca8a04", icon:"🟡", action:"neutral" };
  }
}

export default function PriceAnalyticsPage() {
  const nav = useNavigate();
  const [brand, setBrand] = useState("Chevrolet");
  const [model, setModel] = useState("Cobalt");

  const modelOptions = useMemo(
    () => (MODELS_BY_BRAND[brand]||[]).map(m=>({value:m,label:m})),
    [brand]
  );

  const key  = `${brand}|${model}`;
  const data = PRICE_HISTORY[key] || [];
  const advice = useMemo(() => getAdvice(data), [data]);

  const lastPrice = data[data.length-1]?.avg;
  const firstPrice = data[0]?.avg;
  const totalChange = lastPrice && firstPrice ? lastPrice - firstPrice : 0;
  const totalPct = firstPrice ? Math.round((totalChange / firstPrice) * 100) : 0;

  const fmt = n => Number(n||0).toLocaleString("uz-UZ");

  return (
    <div style={{ padding:"14px 14px 90px" }}>
      <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={()=>nav(-1)} style={{ borderRadius:14 }} />
        <div>
          <div style={{ fontWeight:950, fontSize:18, color:"#0f172a" }}>📈 Narxlar Grafigi</div>
          <div style={{ fontSize:11, color:"#64748b" }}>Bozor tahlili</div>
        </div>
      </div>

      {/* Marka/model tanlash */}
      <div style={{ display:"flex", gap:10, marginBottom:16 }}>
        <Select value={brand} onChange={v=>{setBrand(v);setModel(MODELS_BY_BRAND[v]?.[0]||"");}}
          style={{flex:1}} options={BRANDS.map(b=>({value:b.name,label:b.name}))} />
        <Select value={model} onChange={setModel}
          style={{flex:1}} options={modelOptions} />
      </div>

      {data.length === 0 ? (
        <div style={{ textAlign:"center", padding:40, color:"#94a3b8" }}>
          Bu model uchun tarixiy ma'lumot yo'q
        </div>
      ) : (
        <>
          {/* Statistika */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
            <div style={{ background:"#f8fafc", borderRadius:16, padding:12 }}>
              <div style={{ fontSize:11, color:"#64748b" }}>Hozirgi o'rtacha</div>
              <div style={{ fontWeight:900, fontSize:16, color:"#0f172a", marginTop:4 }}>
                {fmt(lastPrice)} UZS
              </div>
            </div>
            <div style={{ background: totalChange >= 0 ? "#f0fdf4" : "#fff1f2", borderRadius:16, padding:12 }}>
              <div style={{ fontSize:11, color:"#64748b" }}>Yillik o'zgarish</div>
              <div style={{ fontWeight:900, fontSize:16, color: totalChange >= 0 ? "#16a34a" : "#ef4444", marginTop:4, display:"flex", alignItems:"center", gap:4 }}>
                {totalChange >= 0
                  ? <RiseOutlined />
                  : <FallOutlined />}
                {totalPct > 0 ? "+" : ""}{totalPct}%
              </div>
            </div>
          </div>

          {/* Graf */}
          <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:18, padding:14, marginBottom:14 }}>
            <div style={{ fontWeight:800, color:"#0f172a", marginBottom:10 }}>
              {brand} {model} — Narx tarixi
            </div>
            <MiniChart data={data} color="#0ea5e9" />
          </div>

          {/* Maslahat */}
          {advice && (
            <div style={{
              background: `${advice.color}11`,
              border: `2px solid ${advice.color}44`,
              borderRadius:16, padding:16
            }}>
              <div style={{ fontSize:22, marginBottom:8 }}>{advice.icon}</div>
              <div style={{ fontWeight:900, color: advice.color, fontSize:15, marginBottom:4 }}>
                {advice.action === "buy" ? "Hozir sotib olish vaqti!" :
                 advice.action === "wait" ? "Kuting, narx tushadi" :
                 "Barqaror narx"}
              </div>
              <div style={{ fontSize:13, color:"#334155", lineHeight:1.5 }}>{advice.text}</div>
            </div>
          )}

          {/* Oylik jadval */}
          <div style={{ marginTop:14, background:"#fff", border:"1px solid #e2e8f0", borderRadius:18, overflow:"hidden" }}>
            <div style={{ padding:"10px 14px", fontWeight:800, color:"#0f172a", borderBottom:"1px solid #f1f5f9" }}>
              Oylik narxlar
            </div>
            {[...data].reverse().slice(0,6).map((d, i) => {
              const prev = data[data.length - 2 - i];
              const ch   = prev ? d.avg - prev.avg : 0;
              return (
                <div key={i} style={{
                  padding:"10px 14px", borderBottom:"1px solid #f8fafc",
                  display:"flex", justifyContent:"space-between", alignItems:"center"
                }}>
                  <span style={{ color:"#64748b", fontSize:13 }}>{d.month}</span>
                  <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                    <span style={{ fontWeight:800, fontSize:13 }}>{fmt(d.avg)} UZS</span>
                    {ch !== 0 && (
                      <span style={{ fontSize:11, color: ch > 0 ? "#16a34a" : "#ef4444", fontWeight:700 }}>
                        {ch > 0 ? "+" : ""}{fmt(Math.abs(ch))}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
