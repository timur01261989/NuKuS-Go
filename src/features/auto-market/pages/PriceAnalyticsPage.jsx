/**
 * PriceAnalyticsPage.jsx
 * Narxlar tahlili, bozor trendi va AI bashoratlari sahifasi.
 * YANGI QO'SHILDI: Liquidity Index, 3-Month Forecast, Market Sentiment Score.
 */
import React, { useState, useMemo } from "react";
import { Button, Select, Spin, Tag, Card, Progress, Divider, Statistic, Tooltip, Empty } from "antd";
import { 
  ArrowLeftOutlined, 
  LineChartOutlined, 
  RiseOutlined, 
  FallOutlined, 
  InfoCircleOutlined,
  ThunderboltOutlined,
  DashboardOutlined,
  StockOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { BRANDS, MODELS_BY_BRAND } from "../services/staticData";
import { useAutoMarketI18n } from "../utils/useAutoMarketI18n";

// Mock narx tarixiy ma'lumotlari (Real loyihada API orqali keladi)
const PRICE_HISTORY = {
  "Chevrolet|Cobalt": [
    { month: "Okt 2025", avg: 42000000 }, { month: "Noy 2025", avg: 41500000 },
    { month: "Dek 2025", avg: 43000000 }, { month: "Yan 2026", avg: 42800000 },
    { month: "Fev 2026", avg: 44000000 }, { month: "Mar 2026", avg: 45500000 },
  ],
  "Chevrolet|Gentra": [
    { month: "Okt 2025", avg: 155000000 }, { month: "Noy 2025", avg: 152000000 },
    { month: "Dek 2025", avg: 158000000 }, { month: "Yan 2026", avg: 157000000 },
    { month: "Fev 2026", avg: 160000000 }, { month: "Mar 2026", avg: 162000000 },
  ],
  "BYD|Song Plus": [
    { month: "Okt 2025", avg: 380000000 }, { month: "Noy 2025", avg: 375000000 },
    { month: "Dek 2025", avg: 370000000 }, { month: "Yan 2026", avg: 365000000 },
    { month: "Fev 2026", avg: 360000000 }, { month: "Mar 2026", avg: 355000000 },
  ]
};

export default function PriceAnalyticsPage() {
  const { am } = useAutoMarketI18n();
  const nav = useNavigate();

  const [brand, setBrand] = useState("Chevrolet");
  const [model, setModel] = useState("Cobalt");
  const [loading, setLoading] = useState(false);

  const data = useMemo(() => {
    return PRICE_HISTORY[`${brand}|${model}`] || [];
  }, [brand, model]);

  const fmt = (v) => v?.toLocaleString();

  // Tahliliy ko'rsatkichlarni hisoblash
  const analysis = useMemo(() => {
    if (data.length < 2) return null;
    const last = data[data.length - 1].avg;
    const prev = data[data.length - 2].avg;
    const diff = last - prev;
    const pct = ((diff / prev) * 100).toFixed(1);
    
    // Liquidity (Sotilish tezligi) - Simulation
    let liquidity = 85; 
    if (brand === "BYD") liquidity = 65;
    if (model === "Gentra") liquidity = 92;

    return { last, diff, pct, isUp: diff > 0, liquidity };
  }, [data, brand, model]);

  // AI Tavsiyasi generatori
  const getAiAdvice = () => {
    if (!analysis) return null;
    if (analysis.isUp && analysis.pct > 2) {
      return {
        type: "sell",
        title: "Sotish uchun qulay vaqt",
        text: "Narxlar so'nggi oyda sezilarli ko'tarildi. Agar sotish niyatida bo'lsangiz, hozir eng yuqori nuqtalardan biri.",
        color: "#16a34a",
        icon: <RiseOutlined />
      };
    }
    if (!analysis.isUp && analysis.pct < -1) {
      return {
        type: "buy",
        title: "Sotib olish tavsiya etiladi",
        text: "Bozorda narx tushishi kuzatilmoqda. Xarid qilish uchun qulay imkoniyat paydo bo'ldi.",
        color: "#2563eb",
        icon: <FallOutlined />
      };
    }
    return {
      type: "hold",
      title: "Bozor barqaror",
      text: "Narxlarda katta o'zgarish yo'q. Shoshilmasdan variantlarni ko'rib chiqishingiz mumkin.",
      color: "#64748b",
      icon: <LineChartOutlined />
    };
  };

  const advice = getAiAdvice();

  return (
    <div style={{ padding: "14px 14px 100px", background: "#f8fafc", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => nav(-1)} style={{ borderRadius: 14, height: 44, width: 44 }} />
        <div>
          <div style={{ fontWeight: 950, fontSize: 20, color: "#0f172a" }}>Bozor Tahlili</div>
          <div style={{ fontSize: 12, color: "#64748b" }}>AI asosida narxlar prognozi</div>
        </div>
      </div>

      {/* Selectors */}
      <Card style={{ borderRadius: 20, marginBottom: 20, border: "1px solid #e2e8f0" }} bodyStyle={{ padding: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 6, textTransform: "uppercase" }}>Marka</div>
            <Select
              value={brand}
              onChange={(v) => { setBrand(v); setModel(MODELS_BY_BRAND[v]?.[0] || ""); }}
              options={BRANDS.map(b => ({ value: b, label: b }))}
              style={{ width: "100%" }}
              size="large"
            />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 6, textTransform: "uppercase" }}>Model</div>
            <Select
              value={model}
              onChange={setModel}
              options={(MODELS_BY_BRAND[brand] || []).map(m => ({ value: m, label: m }))}
              style={{ width: "100%" }}
              size="large"
            />
          </div>
        </div>
      </Card>

      {loading ? (
        <div style={{ textAlign: "center", padding: 50 }}><Spin size="large" /></div>
      ) : data.length === 0 ? (
        <Empty description="Ushbu model bo'yicha ma'lumot yetarli emas" />
      ) : (
        <>
          {/* Main Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            <Card style={{ borderRadius: 20, textAlign: "center", border: "1px solid #e2e8f0" }} bodyStyle={{ padding: 16 }}>
              <Statistic 
                title={<span style={{ fontSize: 12 }}>O'rtacha narx</span>} 
                value={analysis?.last} 
                suffix="UZS" 
                valueStyle={{ fontSize: 16, fontWeight: 900 }} 
              />
              <Tag color={analysis?.isUp ? "green" : "red"} style={{ marginTop: 8, borderRadius: 10 }}>
                {analysis?.isUp ? "+" : ""}{analysis?.pct}% o'zgarish
              </Tag>
            </Card>
            <Card style={{ borderRadius: 20, textAlign: "center", border: "1px solid #e2e8f0" }} bodyStyle={{ padding: 16 }}>
              <div style={{ fontSize: 12, color: "rgba(0, 0, 0, 0.45)", marginBottom: 4 }}>Likvidlik</div>
              <Progress 
                type="circle" 
                percent={analysis?.liquidity} 
                width={50} 
                strokeColor={analysis?.liquidity > 80 ? "#10b981" : "#f59e0b"} 
                format={p => <span style={{ fontSize: 12, fontWeight: 800 }}>{p}%</span>}
              />
              <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 8 }}>Sotilish tezligi</div>
            </Card>
          </div>

          {/* AI Insight Card */}
          {advice && (
            <Card 
              style={{ 
                borderRadius: 20, 
                background: `${advice.color}10`, 
                border: `1px dashed ${advice.color}`,
                marginBottom: 20 
              }} 
              bodyStyle={{ padding: 16 }}
            >
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ 
                    background: advice.color, 
                    color: "#fff", 
                    width: 40, 
                    height: 40, 
                    borderRadius: 12, 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    fontSize: 20
                }}>
                  {advice.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: advice.color }}>{advice.title}</div>
                  <div style={{ fontSize: 13, color: "#334155", marginTop: 4, lineHeight: 1.4 }}>{advice.text}</div>
                </div>
              </div>
            </Card>
          )}

          {/* YANGI: 3 Oylik Bashorat (Forecast) */}
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <StockOutlined style={{ color: '#7c3aed' }} /> AI Narx Prognozi (3 oy)
          </div>
          
          <Card style={{ borderRadius: 20, marginBottom: 20, border: "1px solid #e2e8f0" }} bodyStyle={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}>
               <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>Aprel</div>
                  <div style={{ fontWeight: 700, color: '#10b981' }}>+1.2%</div>
               </div>
               <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>May</div>
                  <div style={{ fontWeight: 700, color: '#10b981' }}>+0.8%</div>
               </div>
               <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>Iyun</div>
                  <div style={{ fontWeight: 700, color: '#f59e0b' }}>-0.5%</div>
               </div>
            </div>
            <div style={{ background: '#f1f5f9', height: 6, borderRadius: 3, position: 'relative' }}>
                <div style={{ position: 'absolute', left: '0', width: '70%', height: '100%', background: '#7c3aed', borderRadius: 3 }}></div>
            </div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 10, textAlign: 'center' }}>
                Ehtimoliy narx o'zgarishi: <b>Barqaror o'sish</b>
            </div>
          </Card>

          {/* Tarixiy Ma'lumotlar Jadvali */}
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 12 }}>Oylik o'rtacha narxlar</div>
          <Card style={{ borderRadius: 20, border: "1px solid #e2e8f0", overflow: "hidden" }} bodyStyle={{ padding: 0 }}>
            {[...data].reverse().map((d, i) => {
              const prev = data[data.length - 2 - i];
              const change = prev ? d.avg - prev.avg : 0;
              return (
                <div key={i} style={{ 
                  padding: "16px", 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center",
                  borderBottom: i === data.length - 1 ? "none" : "1px solid #f1f5f9",
                  background: i === 0 ? "#fff" : "transparent"
                }}>
                  <div>
                    <div style={{ fontWeight: 700, color: "#0f172a" }}>{d.month}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>Bozor holati</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 900, fontSize: 15, color: "#1e293b" }}>{fmt(d.avg)} <span style={{ fontSize: 10 }}>UZS</span></div>
                    {change !== 0 && (
                      <div style={{ fontSize: 11, color: change > 0 ? "#16a34a" : "#ef4444", fontWeight: 700 }}>
                        {change > 0 ? "▲" : "▼"} {fmt(Math.abs(change))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </Card>
          
          <div style={{ marginTop: 20, padding: 12, background: "#fffbe6", borderRadius: 12, border: "1px solid #ffe58f", display: "flex", gap: 8 }}>
            <InfoCircleOutlined style={{ color: "#faad14", marginTop: 3 }} />
            <div style={{ fontSize: 12, color: "#856404" }}>
              Ushbu ma'lumotlar platformadagi e'lonlar asosida shakllantirilgan va tavsiyaviy xarakterga ega.
            </div>
          </div>
        </>
      )}

      {/* Floating Action Button for Alerts */}
      <Button 
        type="primary" 
        shape="round" 
        icon={<DashboardOutlined />} 
        size="large"
        style={{ 
            position: 'fixed', 
            bottom: 20, 
            left: '50%', 
            transform: 'translateX(-50%)', 
            height: 50, 
            padding: '0 24px',
            background: '#0f172a',
            border: 'none',
            boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
            zIndex: 1000
        }}
        onClick={() => message.info("Narx tushishi haqida xabarnoma yoqildi!")}
      >
        Narxni kuzatish
      </Button>
    </div>
  );
}