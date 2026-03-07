/**
 * GarajPage.jsx - "Aqlli Garaj"
 * * Funksiyalar:
 * 1. Hujjatlar nazorati (Sug'urta va Texnik ko'rik muddati)
 * 2. Servis daftarchasi (Moy almashtirish va yurgan masofa monitoringi)
 * 3. Narx monitoringi (Bozordagi real narx bilan solishtirish)
 * 4. AI Eslatmalar
 */
import React, { useEffect, useState } from "react";
import { 
  Button, 
  Empty, 
  Tag, 
  message, 
  Badge, 
  Tabs, 
  Progress, 
  Card, 
  Row, 
  Col, 
  Alert, 
  Modal, 
  Form, 
  Input, 
  DatePicker, 
  InputNumber 
} from "antd";
import { 
  ArrowLeftOutlined, 
  DeleteOutlined, 
  RightOutlined, 
  BellOutlined, 
  PlusOutlined,
  SafetyCertificateOutlined,
  DashboardOutlined,
  ToolOutlined,
  LineChartOutlined,
  InfoCircleOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useGaraj } from "../context/GarajContext";
import { useAutoMarketI18n } from "../utils/useAutoMarketI18n";
import dayjs from "dayjs";

export default function GarajPage() {
  const { am } = useAutoMarketI18n();
  const nav = useNavigate();
  const { items, remove, addItem } = useGaraj();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState("1");

  // Formatlash yordamchisi
  const fmt = (n, cur = "USD") => {
    if (!n) return "—";
    return n.toLocaleString() + (cur === "USD" ? " $" : " UZS");
  };

  // Yangi mashina qo'shish (Garajga AI nazorati uchun)
  const handleAddCar = async (values) => {
    try {
      const newCar = {
        ad_id: "my-car-" + Date.now(),
        brand: values.brand,
        model: values.model,
        price_at_add: values.purchase_price,
        current_price: values.purchase_price, // Dinamik o'zgaradi
        image: null,
        added_at: new Date().toISOString(),
        // Aqlli funksiyalar uchun ma'lumotlar:
        is_my_own: true,
        current_km: values.current_km,
        insurance_expiry: values.insurance_expiry.toISOString(),
        tech_check_expiry: values.tech_check_expiry.toISOString(),
        last_oil_change: values.current_km,
        next_oil_change: values.current_km + 8000
      };
      
      await addItem(newCar);
      setIsModalOpen(false);
      form.resetFields();
      message.success("Mashina 'Aqlli Garaj'ga qo'shildi!");
    } catch (e) {
      message.error("Xatolik yuz berdi");
    }
  };

  const handleRemove = async (adId) => {
    await remove(adId);
    message.info("Garajdan o'chirildi");
  };

  // Mashina kartasi komponenti
  const CarCard = ({ g }) => {
    const daysToInsurance = dayjs(g.insurance_expiry).diff(dayjs(), 'day');
    const oilProgress = g.last_oil_change ? Math.min(100, ((g.current_km - g.last_oil_change) / 8000) * 100) : 0;
    const isPriceDropped = g.current_price < g.price_at_add;

    return (
      <Card 
        style={{ borderRadius: 20, marginBottom: 16, border: "none", boxShadow: "0 8px 24px rgba(0,0,0,0.05)" }}
        bodyStyle={{ padding: 16 }}
      >
        <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
          <div style={{ position: "relative" }}>
            <img 
              src={g.image || "https://images.unsplash.com/photo-1494976388531-d11e99a58cbf?w=400"} 
              style={{ width: 110, height: 80, borderRadius: 16, objectFit: "cover" }} 
              alt="car"
            />
            {isPriceDropped && (
              <Badge.Ribbon text="ARZONLADI" color="green" style={{ top: -10, left: -10 }} />
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <h3 style={{ margin: 0, fontWeight: 900, fontSize: 17 }}>{g.brand} {g.model}</h3>
              <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleRemove(g.ad_id)} />
            </div>
            <div style={{ marginTop: 4 }}>
              <span style={{ fontWeight: 800, color: "#0ea5e9" }}>{fmt(g.current_price, g.currency)}</span>
              {isPriceDropped && (
                <span style={{ fontSize: 11, color: "#16a34a", marginLeft: 8 }}>
                  ↓ {fmt(g.price_at_add - g.current_price)} tejaldi
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Aqlli Garaj Paneli */}
        {g.is_my_own && (
          <div style={{ background: "#f8fafc", borderRadius: 16, padding: 12 }}>
            <Row gutter={[12, 12]}>
              <Col span={12}>
                <div style={{ fontSize: 11, color: "#64748b" }}><SafetyCertificateOutlined /> Sug'urta</div>
                <div style={{ fontWeight: 700, color: daysToInsurance < 10 ? "#ef4444" : "#0f172a" }}>
                  {daysToInsurance > 0 ? `${daysToInsurance} kun qoldi` : "Muddati o'tgan"}
                </div>
              </Col>
              <Col span={12}>
                <div style={{ fontSize: 11, color: "#64748b" }}><DashboardOutlined /> Tex-ko'rik</div>
                <div style={{ fontWeight: 700 }}>Faol</div>
              </Col>
            </Row>

            <div style={{ marginTop: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                <span style={{ color: "#64748b" }}><ToolOutlined /> Moy almashtirish (Servis)</span>
                <span style={{ fontWeight: 700 }}>{8000 - (g.current_km - g.last_oil_change)} km qoldi</span>
              </div>
              <Progress percent={Math.round(oilProgress)} status={oilProgress > 90 ? "exception" : "active"} strokeColor="#3b82f6" />
            </div>
          </div>
        )}

        {daysToInsurance < 7 && g.is_my_own && (
          <Alert
            message="Eslatma: Sug'urta muddati yaqinlashmoqda"
            type="warning"
            showIcon
            style={{ marginTop: 12, borderRadius: 10, fontSize: 12 }}
          />
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <Button 
            block 
            icon={<LineChartOutlined />} 
            onClick={() => nav(`/auto-market/analytics?brand=${g.brand}&model=${g.model}`)}
            style={{ borderRadius: 12 }}
          >
            Narx tahlili
          </Button>
          <Button 
            block 
            type="primary" 
            icon={<RightOutlined />} 
            onClick={() => nav(`/auto-market/ad/${g.ad_id}`)}
            style={{ borderRadius: 12, background: "#0ea5e9", border: "none" }}
          >
            Batafsil
          </Button>
        </div>
      </Card>
    );
  };

  return (
    <div style={{ padding: "16px 16px 100px", background: "#f1f5f9", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Button icon={<ArrowLeftOutlined />} shape="circle" onClick={() => nav(-1)} />
          <div>
            <h1 style={{ margin: 0, fontWeight: 950, fontSize: 22 }}>Mening Garajim</h1>
            <div style={{ fontSize: 12, color: "#64748b" }}>Aqlli nazorat va e'lonlar</div>
          </div>
        </div>
        <Badge count={items.length} color="#0ea5e9">
          <Button type="primary" shape="circle" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)} />
        </Badge>
      </div>

      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        centered
        items={[
          { key: "1", label: "Hammasi" },
          { key: "2", label: "Mening mashinalarim" },
          { key: "3", label: "Saqlanganlar" },
        ]}
      />

      {items.length === 0 ? (
        <Empty 
          image={Empty.PRESENTED_IMAGE_SIMPLE} 
          description="Garajingiz hozircha bo'sh" 
          style={{ marginTop: 50 }}
        >
          <Button type="primary" onClick={() => setIsModalOpen(true)}>Mashina qo'shish</Button>
        </Empty>
      ) : (
        <div style={{ marginTop: 16 }}>
          {items
            .filter(item => {
              if (activeTab === "2") return item.is_my_own;
              if (activeTab === "3") return !item.is_my_own;
              return true;
            })
            .map(g => <CarCard key={g.ad_id} g={g} />)
          }
        </div>
      )}

      {/* Mashina qo'shish modali */}
      <Modal
        title={<div style={{ fontWeight: 800 }}><CarOutlined /> Aqlli Garajga qo'shish</div>}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        okText="Saqlash"
        cancelText="Bekor qilish"
        centered
        borderRadius={20}
      >
        <Form form={form} layout="vertical" onFinish={handleAddCar} style={{ marginTop: 16 }}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="brand" label="Brend" rules={[{ required: true }]}><Input placeholder="Masalan: Chevrolet" /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="model" label="Model" rules={[{ required: true }]}><Input placeholder="Gentra" /></Form.Item>
            </Col>
          </Row>
          <Form.Item name="purchase_price" label="Sotib olingan narxi ($)" rules={[{ required: true }]}><InputNumber style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="current_km" label="Hozirgi yurgan masofasi (km)" rules={[{ required: true }]}><InputNumber style={{ width: "100%" }} /></Form.Item>
          
          <div style={{ padding: "12px", background: "#f0f9ff", borderRadius: 12, marginBottom: 16 }}>
             <div style={{ fontSize: 12, fontWeight: 700, color: "#0369a1", marginBottom: 8 }}><BellOutlined /> AI Eslatmalar uchun:</div>
             <Row gutter={12}>
               <Col span={12}>
                 <Form.Item name="insurance_expiry" label="Sug'urta muddati" rules={[{ required: true }]}><DatePicker style={{ width: "100%" }} /></Form.Item>
               </Col>
               <Col span={12}>
                 <Form.Item name="tech_check_expiry" label="Tex-ko'rik muddati" rules={[{ required: true }]}><DatePicker style={{ width: "100%" }} /></Form.Item>
               </Col>
             </Row>
          </div>
        </Form>
      </Modal>

      {/* AI Analitika Paneli (Pastda doimiy) */}
      <div style={{ 
        position: "fixed", 
        bottom: 80, 
        left: 16, 
        right: 16, 
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", 
        borderRadius: 20, 
        padding: "12px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ background: "#3b82f6", padding: 8, borderRadius: 12 }}>
            <InfoCircleOutlined style={{ color: "#fff" }} />
          </div>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>AI Maslahatchi</div>
            <div style={{ color: "#94a3b8", fontSize: 11 }}>Bozorda Gentra narxi 2% ga tushdi</div>
          </div>
        </div>
        <Button type="primary" size="small" style={{ borderRadius: 8, fontSize: 11 }}>Tahlil</Button>
      </div>
    </div>
  );
}

// Qo'shimcha ikonka
function CarOutlined() {
  return <span role="img" aria-label="car" className="anticon">🚗</span>;
}