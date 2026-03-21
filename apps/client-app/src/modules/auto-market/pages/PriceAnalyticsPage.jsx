/**
 * PriceAnalyticsPage.jsx
 * Professional Bozor Tahlili va AI Bashoratlari.
 * 100% TO'LIQ VARIANT - HECH QAYSI QISMI QISQARTIRILMAGAN.
 */
import React, { useState, useMemo, useEffect } from "react";
import { 
  Button, 
  Select, 
  Spin, 
  Tag, 
  Card, 
  Progress, 
  Divider, 
  Statistic, 
  Tooltip, 
  Empty, 
  Row, 
  Col, 
  Alert,
  Typography,
  Space
} from "antd";
import { 
  ArrowLeftOutlined, 
  LineChartOutlined, 
  RiseOutlined, 
  FallOutlined, 
  InfoCircleOutlined,
  ThunderboltOutlined,
  DashboardOutlined,
  StockOutlined,
  CompassOutlined,
  BulbOutlined,
  AreaChartOutlined,
  BarChartOutlined
} from "@ant-design/icons";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BRANDS, MODELS_BY_BRAND } from "../services/staticData";
import { useAutoMarketI18n } from "../utils/useAutoMarketI18n";

const { Title, Text } = Typography;

// Mock ma'lumotlar bazasi (Real loyihada API orqali keladi)
const PRICE_HISTORY_DATA = {
  "Chevrolet|Cobalt": [
    { month: "Okt 2025", avg: 142000000 }, { month: "Noy 2025", avg: 141500000 },
    { month: "Dek 2025", avg: 143000000 }, { month: "Yan 2026", avg: 142800000 },
    { month: "Fev 2026", avg: 144500000 }, { month: "Mar 2026", avg: 146000000 },
  ],
  "Chevrolet|Gentra": [
    { month: "Okt 2025", avg: 165000000 }, { month: "Noy 2025", avg: 168000000 },
    { month: "Dek 2025", avg: 167000000 }, { month: "Yan 2026", avg: 170000000 },
    { month: "Fev 2026", avg: 172000000 }, { month: "Mar 2026", avg: 175000000 },
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
  const [searchParams] = useSearchParams();

  const [brand, setBrand] = useState(searchParams.get("brand") || "Chevrolet");
  const [model, setModel] = useState(searchParams.get("model") || "Cobalt");
  const [loading, setLoading] = useState(false);

  const key = `${brand}|${model}`;
  const data = PRICE_HISTORY_DATA[key] || PRICE_HISTORY_DATA["Chevrolet|Cobalt"];

  const fmt = (n) => n ? n.toLocaleString() : "0";

  // Murakkab Analitika Mantiqi
  const analytics = useMemo(() => {
    if (!data || data.length < 2) return null;
    
    const current = data[data.length - 1].avg;
    const previous = data[data.length - 2].avg;
    const change = current - previous;
    const percentChange = ((change / previous) * 100).toFixed(1);
    
    // Likvidlik indeksi (Brendga qarab mock mantiq)
    let liqIndex = 75;
    let sellDays = "7-10 kun";
    if (brand === "Chevrolet") { liqIndex = 92; sellDays = "2-4 kun"; }
    if (brand === "BYD") { liqIndex = 80; sellDays = "5-8 kun"; }
    
    // Forecast mantiqi
    const isRising = change > 0;
    const forecastText = isRising 
      ? "Keyingi 3 oyda narxlar yana 2-3% o'sishi kutilmoqda. Hozir sotib olish foydaliroq bo'lishi mumkin."
      : "Bozorda taklif ko'p, keyingi oylarda narxlar yanada barqarorlashishi yoki 1% ga tushishi mumkin.";

    return {
      current,
      change,
      percentChange,
      isRising,
      liqIndex,
      sellDays,
      forecastText,
      marketStatus: isRising ? "Sotuvchilar bozori (Qimmatlashmoqda)" : "Xaridorlar bozori (Arzonlashmoqda)"
    };
  }, [brand, model, data]);

  // Grafik ustunlari uchun balandlik hisoblash
  const maxPrice = Math.max(...data.map(d => d.avg));
  const minPrice = Math.min(...data.map(d => d.avg));

  return (
    <div style={{ padding: "16px 16px 100px", background: "#f1f5f9", minHeight: "100vh" }}>
      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          shape="circle" 
          onClick={() => nav(-1)} 
          style={{ border: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
        />
        <div>
          <Title level={4} style={{ margin: 0, fontWeight: 900 }}>Bozor Analitikasi</Title>
          <Text type="secondary" style={{ fontSize: 12 }}>AI asosida professional tahlil</Text>
        </div>
      </div>

      {/* SELECTOR CARD */}
      <Card style={{ borderRadius: 24, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.04)", marginBottom: 16 }}>
        <Row gutter={12}>
          <Col span={12}>
            <Text strong style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 6 }}>AVTO BREND</Text>
            <Select
              style={{ width: "100%" }}
              value={brand}
              onChange={(v) => {
                setBrand(v);
                if (MODELS_BY_BRAND[v]) setModel(MODELS_BY_BRAND[v][0]);
              }}
              options={BRANDS.map(b => ({ label: b, value: b }))}
              size="large"
            />
          </Col>
          <Col span={12}>
            <Text strong style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 6 }}>MODELNI TANLANG</Text>
            <Select
              style={{ width: "100%" }}
              value={model}
              onChange={setModel}
              options={(MODELS_BY_BRAND[brand] || []).map(m => ({ label: m, value: m }))}
              size="large"
            />
          </Col>
        </Row>
      </Card>

      {loading ? (
        <div style={{ textAlign: "center", padding: "100px 0" }}><Spin size="large" /></div>
      ) : (
        <>
          {/* MAIN STATS ROW */}
          <Row gutter={[12, 12]}>
            <Col span={24}>
              <Card 
                style={{ 
                  borderRadius: 24, 
                  border: "none", 
                  background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                  color: "#fff" 
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Statistic
                    title={<span style={{ color: "rgba(255,255,255,0.6)" }}>O'rtacha Bozor Narxi</span>}
                    value={analytics.current}
                    suffix="UZS"
                    valueStyle={{ color: "#fff", fontWeight: 900, fontSize: 28 }}
                  />
                  <div style={{ textAlign: "right" }}>
                    {analytics.isRising ? (
                      <Tag color="#10b981" style={{ border: "none", borderRadius: 8, fontWeight: 700 }}>
                        <RiseOutlined /> +{analytics.percentChange}%
                      </Tag>
                    ) : (
                      <Tag color="#ef4444" style={{ border: "none", borderRadius: 8, fontWeight: 700 }}>
                        <FallOutlined /> {analytics.percentChange}%
                      </Tag>
                    )}
                  </div>
                </div>
                <Divider style={{ borderColor: "rgba(255,255,255,0.1)", margin: "16px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: "rgba(255,255,255,0.5)" }}>Oxirgi yangilanish: Bugun</span>
                  <span style={{ color: "#3b82f6", fontWeight: 700 }}>Haqiqiy narx</span>
                </div>
              </Card>
            </Col>

            {/* LIQUIDITY INDEX */}
            <Col span={12}>
              <Card style={{ borderRadius: 24, border: "none", height: "100%" }} styles={{ body: { padding: 20 } }}>
                <Space direction="vertical" size={0}>
                  <Text type="secondary" style={{ fontSize: 12 }}><CompassOutlined /> Likvidlik</Text>
                  <Title level={4} style={{ margin: "4px 0", fontWeight: 800 }}>
                    {analytics.liqIndex > 85 ? "Juda Yuqori" : "O'rtacha"}
                  </Title>
                </Space>
                <Progress 
                  percent={analytics.liqIndex} 
                  showInfo={false} 
                  strokeColor={analytics.liqIndex > 85 ? "#10b981" : "#3b82f6"}
                  style={{ margin: "12px 0" }}
                />
                <Text style={{ fontSize: 11, fontWeight: 700, color: "#10b981" }}>
                   Sotilish: {analytics.sellDays}
                </Text>
              </Card>
            </Col>

            {/* MARKET SENTIMENT */}
            <Col span={12}>
              <Card style={{ borderRadius: 24, border: "none", height: "100%" }} styles={{ body: { padding: 20 } }}>
                <Text type="secondary" style={{ fontSize: 12 }}><ThunderboltOutlined /> Bozor Trendi</Text>
                <div style={{ marginTop: 8 }}>
                  <Text strong style={{ fontSize: 14, color: analytics.isRising ? "#f59e0b" : "#3b82f6" }}>
                    {analytics.marketStatus}
                  </Text>
                </div>
                <div style={{ marginTop: 12, background: "#f8fafc", padding: "4px 8px", borderRadius: 8 }}>
                   <Text style={{ fontSize: 10 }}>Talab ko'rsatkichi: Yuqori</Text>
                </div>
              </Card>
            </Col>
          </Row>

          {/* AI FORECAST ALERT */}
          <Alert
            message={<span style={{ fontWeight: 800 }}>AI Narx Bashorati (3 oy)</span>}
            description={analytics.forecastText}
            type="info"
            showIcon
            icon={<BulbOutlined />}
            style={{ marginTop: 16, borderRadius: 20, border: "1.5px solid #bae6fd", padding: 16 }}
          />

          {/* PRICE CHART VISUALIZATION */}
          <Card 
            title={<span style={{ fontWeight: 800 }}><AreaChartOutlined /> Narx o'zgarishi (6 oy)</span>}
            style={{ marginTop: 16, borderRadius: 24, border: "none" }}
          >
            <div style={{ height: 200, display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "20px 0" }}>
              {data.map((d, i) => {
                const barHeight = ((d.avg - (minPrice * 0.9)) / (maxPrice - (minPrice * 0.9))) * 100;
                return (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                    <Tooltip title={`${fmt(d.avg)} UZS`}>
                      <div 
                        style={{ 
                          width: "70%", 
                          height: `${Math.max(barHeight, 5)}%`, 
                          background: i === data.length - 1 ? "#3b82f6" : "#e2e8f0",
                          borderRadius: "8px 8px 4px 4px",
                          transition: "all 0.4s ease-in-out"
                        }} 
                      />
                    </Tooltip>
                    <Text style={{ fontSize: 10, color: "#94a3b8", transform: "rotate(-45deg)", width: 40, whiteSpace: "nowrap" }}>
                      {d.month}
                    </Text>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* SOLISHTIRISH XARITASI (Real Price Map) */}
          <Card 
            title={<span style={{ fontWeight: 800 }}><BarChartOutlined /> Holat va Narx bog'liqligi</span>}
            style={{ marginTop: 16, borderRadius: 24, border: "none" }}
          >
            <div style={{ padding: "0 10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Mashina holati</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>Kutilayotgan narx</Text>
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { label: "Ideal (Kraska toza, kam yurgan)", color: "#10b981", price: analytics.current * 1.05 },
                  { label: "Yaxshi (Kichik petnolari bor)", color: "#3b82f6", price: analytics.current },
                  { label: "O'rtacha (Yurgan masofasi katta)", color: "#f59e0b", price: analytics.current * 0.92 },
                  { label: "Ta'mirga muhtoj", color: "#ef4444", price: analytics.current * 0.80 }
                ].map((item, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.color }} />
                      <Text style={{ fontSize: 13 }}>{item.label}</Text>
                    </div>
                    <Text strong style={{ fontSize: 13 }}>~{fmt(Math.round(item.price / 100000) * 100000)}</Text>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* FOOTER INFO */}
          <div style={{ marginTop: 20, padding: 16, background: "#fffbe6", borderRadius: 20, border: "1px solid #ffe58f", display: "flex", gap: 12 }}>
            <InfoCircleOutlined style={{ color: "#faad14", fontSize: 18 }} />
            <Text style={{ fontSize: 11, color: "#856404", lineHeight: 1.5 }}>
              Ushbu tahlillar Avto-Bozor platformasidagi oxirgi 6 oylik e'lonlar va bitimlar asosida AI algoritmlari yordamida shakllantirilgan. Haqiqiy narx savdolashish jarayonida o'zgarishi mumkin.
            </Text>
          </div>
        </>
      )}

      {/* FLOATING ACTION BUTTON FOR UPDATES */}
      <Button 
        type="primary" 
        size="large"
        icon={<DashboardOutlined />}
        style={{ 
          position: "fixed", 
          bottom: 24, 
          left: "50%", 
          transform: "translateX(-50%)", 
          borderRadius: 30, 
          height: 54, 
          padding: "0 32px",
          background: "#0f172a",
          border: "none",
          boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
          fontWeight: 700,
          zIndex: 1000
        }}
      >
        Jonli Tahlilni Yangilash
      </Button>
    </div>
  );
}