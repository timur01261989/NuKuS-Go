/**
 * GarajPage.jsx - "Aqlli Garaj"
 * 100% TO'LIQ VARIANT - HECH QANDAY QISQARTIRMASIZ.
 * Funksiyalar:
 * 1. Hujjatlar nazorati (Sug'urta va Texosmotr)
 * 2. Moy almashtirish monitoringi (Progress bar)
 * 3. AI Eslatmalar (Moy va hujjatlar uchun)
 * 4. Narx o'zgarishi tahlili
 */
import React, { useEffect, useState } from "react";
import { 
  Button, 
  Empty, 
  Tag, 
  message, 
  Badge, 
  Progress, 
  Card, 
  Row, 
  Col, 
  Alert, 
  Modal, 
  Form, 
  Input, 
  DatePicker, 
  InputNumber,
  Typography,
  Divider
} from "antd";
import { 
  ArrowLeftOutlined, 
  DeleteOutlined, 
  RightOutlined, 
  PlusOutlined,
  SafetyCertificateOutlined,
  DashboardOutlined,
  ToolOutlined,
  InfoCircleOutlined,
  BulbOutlined,
  HistoryOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useGaraj } from "../context/GarajContext";
import { useAutoMarketI18n } from "../utils/useAutoMarketI18n";
import dayjs from "dayjs";

const { Text, Title } = Typography;

export default function GarajPage() {
  const { am } = useAutoMarketI18n();
  const nav = useNavigate();
  const { items, remove } = useGaraj();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  // Narxni formatlash
  const fmt = (n, cur = "USD") => {
    if (!n) return "—";
    return n.toLocaleString("uz-UZ") + " " + cur;
  };

  // AI Eslatmalarni hisoblash funksiyasi
  const getAiInsights = (car) => {
    const alerts = [];
    const today = dayjs();

    // 1. Sug'urta muddati
    if (car.insurance_expiry) {
      const diff = dayjs(car.insurance_expiry).diff(today, 'day');
      if (diff > 0 && diff <= 10) alerts.push({ type: 'warning', msg: `Sug'urta muddati ${diff} kundan keyin tugaydi!` });
      if (diff <= 0) alerts.push({ type: 'error', msg: "Sug'urta muddati tugagan! Yangilashni unutmang." });
    }

    // 2. Moy almashtirish
    const drivenSinceOil = (car.current_mileage || 0) - (car.last_oil_change || 0);
    const oilLimit = car.oil_limit || 7000;
    if (drivenSinceOil >= oilLimit - 500) {
      alerts.push({ type: 'warning', msg: "Dvigatel moyini almashtirish vaqti yaqinlashmoqda." });
    }

    return alerts;
  };

  return (
    <div style={{ padding: 16, paddingBottom: 100, background: "#f8fafc", minHeight: "100vh" }}>
      
      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          shape="circle" 
          onClick={() => nav(-1)} 
          style={{ border: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
        />
        <Title level={4} style={{ margin: 0, fontWeight: 900 }}>Mening Garajim</Title>
      </div>

      {items.length === 0 ? (
        <Empty 
          image={Empty.PRESENTED_IMAGE_SIMPLE} 
          description="Garajingiz bo'sh. Mashinalarni 'Yurakcha' orqali qo'shing."
          style={{ marginTop: 60 }}
        />
      ) : (
        <div style={{ display: "grid", gap: 20 }}>
          {items.map((car) => {
            const insights = getAiInsights(car);
            const drivenSinceOil = (car.current_mileage || 0) - (car.last_oil_change || 0);
            const oilLimit = car.oil_limit || 7000;
            const oilPercent = Math.min(Math.round((drivenSinceOil / oilLimit) * 100), 100);

            return (
              <Card 
                key={car.ad_id || car.id} 
                style={{ borderRadius: 24, border: "none", boxShadow: "0 10px 30px rgba(0,0,0,0.04)" }}
                styles={{ body: { padding: 20 } }}
              >
                {/* 1. MASHINA ASOSIY MA'LUMOTI */}
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                  <div>
                    <Title level={5} style={{ margin: 0, fontWeight: 800 }}>
                      {car.brand} {car.model} {car.year && `(${car.year})`}
                    </Title>
                    <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                      <Tag color="blue" style={{ borderRadius: 6, margin: 0 }}>{car.car_plate || "Raqamsiz"}</Tag>
                      <Tag color="default" style={{ borderRadius: 6 }}>{car.current_mileage?.toLocaleString()} km</Tag>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: "#16a34a", fontWeight: 900, fontSize: 18 }}>
                      {fmt(car.current_price || car.price, car.currency)}
                    </div>
                    {car.price_at_add > car.current_price && (
                      <div style={{ fontSize: 11, color: "#ef4444" }}>
                        ↓ {fmt(car.price_at_add - car.current_price, car.currency)} arzonladi
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. MOY MONITORINGI */}
                <div style={{ background: "#f1f5f9", padding: 15, borderRadius: 18, marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                    <Text strong><ToolOutlined /> Moy almashtirish</Text>
                    <Text>{drivenSinceOil} / {oilLimit} km</Text>
                  </div>
                  <Progress 
                    percent={oilPercent} 
                    status={oilPercent > 90 ? "exception" : "active"} 
                    strokeColor={oilPercent > 90 ? "#ef4444" : "#3b82f6"}
                    showInfo={false}
                    strokeWidth={10}
                  />
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 6, display: "flex", justifyContent: "space-between" }}>
                    <span>Oxirgi: {car.last_oil_change || 0} km</span>
                    <span>Qoldi: {Math.max(oilLimit - drivenSinceOil, 0)} km</span>
                  </div>
                </div>

                {/* 3. HUJJATLAR PANELİ */}
                <Row gutter={10} style={{ marginBottom: 16 }}>
                  <Col span={12}>
                    <div style={{ border: "1px solid #f1f5f9", padding: 10, borderRadius: 14 }}>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}><SafetyCertificateOutlined /> Sug'urta</div>
                      <Text strong style={{ fontSize: 13 }}>
                        {car.insurance_expiry ? dayjs(car.insurance_expiry).format("DD.MM.YYYY") : "Belgilanmagan"}
                      </Text>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ border: "1px solid #f1f5f9", padding: 10, borderRadius: 14 }}>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}><HistoryOutlined /> Tex-ko'rik</div>
                      <Text strong style={{ fontSize: 13 }}>
                        {car.tex_expiry ? dayjs(car.tex_expiry).format("DD.MM.YYYY") : "Belgilanmagan"}
                      </Text>
                    </div>
                  </Col>
                </Row>

                {/* 4. AI ESLATMALAR */}
                {insights.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    {insights.map((item, idx) => (
                      <Alert 
                        key={idx}
                        message={item.msg}
                        type={item.type}
                        showIcon
                        icon={<BulbOutlined />}
                        style={{ borderRadius: 12, marginBottom: 6, fontSize: 12 }}
                      />
                    ))}
                  </div>
                )}

                {/* 5. BOSHQARUV TUGMALARI */}
                <div style={{ display: "flex", gap: 10 }}>
                  <Button 
                    danger 
                    icon={<DeleteOutlined />} 
                    onClick={() => remove(car.ad_id || car.id)}
                    style={{ borderRadius: 12, flex: 1 }}
                  >
                    O'chirish
                  </Button>
                  <Button 
                    type="primary" 
                    icon={<RightOutlined />} 
                    onClick={() => nav(`/auto-market/ad/${car.ad_id || car.id}`)}
                    style={{ borderRadius: 12, flex: 2, background: "#0f172a", border: "none" }}
                  >
                    Batafsil
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* AI QALIBI (BOTTOM FIXED) */}
      <div style={{ 
        position: "fixed", bottom: 20, left: 16, right: 16, 
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", 
        padding: "16px 20px", borderRadius: 24, boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
        display: "flex", alignItems: "center", gap: 15
      }}>
        <div style={{ background: "#3b82f6", padding: 10, borderRadius: 14 }}>
          <DashboardOutlined style={{ color: "#fff", fontSize: 20 }} />
        </div>
        <div>
          <div style={{ color: "#fff", fontWeight: 800, fontSize: 14 }}>AI Garaj Maslahatchisi</div>
          <div style={{ color: "#94a3b8", fontSize: 11 }}>
            {items.length > 0 
              ? `Sizda ${items.length} ta faol monitoring mavjud.` 
              : "Hozircha tahlillar yo'q."}
          </div>
        </div>
      </div>
    </div>
  );
}