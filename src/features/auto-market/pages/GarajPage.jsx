/**
 * GarajPage.jsx
 * "Mening Garajim" — foydalanuvchi orzu qilgan yoki kuzatayotgan mashinalar.
 * 100% TO'LIQ VARIANT - FAQAT GARAJ FUNKSIYALARI SAQLANDI.
 * (Sug'urta va Texosmotr "Daftar" bo'limiga ko'chirildi)
 */
import React, { useEffect, useState } from "react";
import { 
  Button, 
  Empty, 
  Tag, 
  message, 
  Badge, 
  Card, 
  Row, 
  Col, 
  Modal, 
  Form, 
  Input, 
  InputNumber,
  Tooltip 
} from "antd";
import { 
  ArrowLeftOutlined, 
  DeleteOutlined, 
  RightOutlined, 
  PlusOutlined, 
  BellOutlined,
  DashboardOutlined,
  LineChartOutlined,
  InfoCircleOutlined,
  CarOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useGaraj } from "../context/GarajContext";
import { useAutoMarketI18n } from "../utils/useAutoMarketI18n";

export default function GarajPage() {
  const { am } = useAutoMarketI18n();
  const nav = useNavigate();
  const { items, remove, add } = useGaraj();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [priceDrop, setPriceDrop] = useState([]);
  const [form] = Form.useForm();

  // Narx tushishini monitoring qilish
  useEffect(() => {
    if (!items.length) return;
    const drops = items
      .filter(g => g.price_at_add && g.current_price && g.current_price < g.price_at_add)
      .map(g => g.ad_id);
    setPriceDrop(drops);
  }, [items]);

  const fmt = (n, cur) => {
    if (!n) return "—";
    return Number(n).toLocaleString("uz-UZ") + (cur === "USD" ? " $" : " UZS");
  };

  const handleAddCar = async (values) => {
    const newCar = {
      ad_id: "my-" + Date.now(),
      ...values,
      price_at_add: values.current_price,
      added_at: new Date().toISOString(),
      is_my_own: true
    };
    await add(newCar);
    setIsModalOpen(false);
    form.resetFields();
    message.success("Mashina garajga qo'shildi");
  };

  const handleRemove = async (adId) => {
    await remove(adId);
    message.info("Garajdan o'chirildi");
  };

  return (
    <div style={{ padding: "16px 16px 100px", background: "#f8fafc", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Button icon={<ArrowLeftOutlined />} shape="circle" onClick={() => nav(-1)} />
          <div>
            <h1 style={{ margin: 0, fontWeight: 950, fontSize: 22 }}>Mening Garajim</h1>
            <span style={{ fontSize: 12, color: "#64748b" }}>Kuzatilayotgan avtomobillar</span>
          </div>
        </div>
        <Button 
          type="primary" 
          shape="round" 
          icon={<PlusOutlined />} 
          onClick={() => setIsModalOpen(true)}
          style={{ background: "#0f172a", border: "none" }}
        >
          Mashina qo'shish
        </Button>
      </div>

      {items.length === 0 ? (
        <Empty 
          image={Empty.PRESENTED_IMAGE_SIMPLE} 
          description="Garajingiz bo'sh. Mashinalarni 'Yurakcha' orqali qo'shing." 
          style={{ marginTop: 60 }}
        />
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {items.map(g => {
            const dropped = priceDrop.includes(g.ad_id);
            const dropAmt = (g.price_at_add || 0) - (g.current_price || 0);

            return (
              <Card 
                key={g.ad_id} 
                style={{ borderRadius: 24, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}
                bodyStyle={{ padding: 16 }}
              >
                <div style={{ display: "flex", gap: 12 }}>
                  <Badge dot={dropped} offset={[-5, 5]} color="green">
                    <img 
                      src={g.image || g.images?.[0] || "/car-placeholder.png"} 
                      style={{ width: 100, height: 75, borderRadius: 16, objectFit: "cover" }} 
                      alt="auto"
                    />
                  </Badge>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <h3 style={{ margin: 0, fontWeight: 800, fontSize: 16 }}>{g.brand} {g.model}</h3>
                      <Tag color="blue" style={{ borderRadius: 6, margin: 0, fontSize: 10 }}>{g.year}</Tag>
                    </div>

                    <div style={{ marginTop: 8 }}>
                      <span style={{ fontWeight: 800, fontSize: 17, color: "#0ea5e9" }}>
                        {fmt(g.current_price || g.price, g.currency)}
                      </span>
                      {dropped && dropAmt > 0 && (
                        <div style={{ fontSize: 11, color: "#16a34a", fontWeight: 700 }}>
                          <BellOutlined /> {fmt(dropAmt, g.currency)} arzonladi
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ 
                  marginTop: 14, 
                  paddingTop: 12, 
                  borderTop: "1px solid #f1f5f9", 
                  display: "flex", 
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>
                    Qo'shildi: {new Date(g.added_at).toLocaleDateString()}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Button 
                      danger 
                      icon={<DeleteOutlined />} 
                      shape="circle" 
                      size="small"
                      onClick={() => handleRemove(g.ad_id)} 
                    />
                    <Button 
                      type="primary" 
                      icon={<RightOutlined />} 
                      size="small"
                      style={{ borderRadius: 8, background: "#0ea5e9", border: "none" }}
                      onClick={() => nav(`/auto-market/ad/${g.ad_id}`)}
                    >
                      Batafsil
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Mashina qo'shish modali (Faqat asosiy ma'lumotlar) */}
      <Modal 
        title="Mashina ma'lumotlari"
        open={isModalOpen} 
        onCancel={() => setIsModalOpen(false)} 
        onOk={() => form.submit()}
        centered
      >
        <Form form={form} layout="vertical" onFinish={handleAddCar} style={{ marginTop: 16 }}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="brand" label="Brend" rules={[{ required: true }]}><Input placeholder="Chevrolet" /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="model" label="Model" rules={[{ required: true }]}><Input placeholder="Gentra" /></Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="year" label="Yili"><InputNumber style={{ width: "100%" }} placeholder="2024" /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="current_price" label="Narxi"><InputNumber style={{ width: "100%" }} placeholder="15000" /></Form.Item>
            </Col>
          </Row>
          <Alert 
            message="Xarajatlar va servis tarixini 'Avto-Daftar' bo'limida boshqaring." 
            type="info" 
            showIcon 
          />
        </Form>
      </Modal>

      {/* AI Analitika (Faqat narx bo'yicha) */}
      <div style={{ 
        marginTop: 24, 
        padding: 16, 
        background: "#0f172a", 
        borderRadius: 20, 
        color: "#fff",
        display: "flex",
        alignItems: "center",
        gap: 12
      }}>
        <LineChartOutlined style={{ fontSize: 24, color: "#3b82f6" }} />
        <div style={{ fontSize: 12 }}>
          <b>AI maslahati:</b> Garajingizdagi mashinalar narxi tushishi bilan sizga xabar yuboramiz.
        </div>
      </div>
    </div>
  );
}