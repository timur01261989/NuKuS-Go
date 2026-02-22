import React, { useState } from "react";
import { 
  Card, Typography, ConfigProvider, Row, Col, Button, Switch, message, Badge 
} from "antd";
import { 
  CarOutlined, DropboxOutlined, RocketOutlined, 
  GlobalOutlined, EnvironmentOutlined, ArrowLeftOutlined, PoweroffOutlined 
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { translations } from '@i18n/translations';
import { supabase } from "@/lib/supabase";

const { Title, Text } = Typography;

export default function DriverServiceSelect({ onSelectService }) {
  const navigate = useNavigate();
  // State: Onlayn/Oflayn holati
  const [isOnline, setIsOnline] = useState(false);

  const savedLang = localStorage.getItem("appLang") || "uz_lotin";
  const t = translations[savedLang] || translations["uz_lotin"];

  // --- Switch bosilganda ishlaydi ---
  const toggleOnline = (checked) => {
    setIsOnline(checked);
    if (checked) message.success("Siz onlayn rejimdasiz");
    else message.warning("Siz oflayn rejimdasiz");
  };

  // --- Chiqish funksiyasi ---
  const handleExit = () => {
    // Driver mode ichida ortga qaytish: history bo'lsa -1, bo'lmasa driver dashboard
    if (window.history.length > 1) navigate(-1);
    else navigate('/driver/dashboard');
  };

  // --- Xizmatlar ro'yxati ---
  const topServices = [
    { key: "interProv", title: t.interProvincial, icon: <GlobalOutlined />, bg: "#e6f7ff", color: "#1890ff" }, 
    { key: "interDist", title: t.interDistrict, icon: <EnvironmentOutlined />, bg: "#f6ffed", color: "#52c41a" }, 
  ];

  const middleServices = [
    { key: "freight", title: t.freight, icon: <DropboxOutlined />, bg: "#fff7e6", color: "#fa8c16" }, 
    { key: "delivery", title: t.delivery, icon: <RocketOutlined />, bg: "#fff1f0", color: "#f5222d" }, 
  ];

  const taxiService = { key: "taxi", title: t.taxi, icon: <CarOutlined />, bg: "#f9f0ff", color: "#722ed1" }; 

  // Tugma bosilganda kichrayish effekti (Taktil)
  const btnTouchProps = {
    onMouseDown: (e) => e.currentTarget.style.transform = "scale(0.96)",
    onMouseUp: (e) => e.currentTarget.style.transform = "scale(1)",
    onTouchStart: (e) => e.currentTarget.style.transform = "scale(0.96)",
    onTouchEnd: (e) => e.currentTarget.style.transform = "scale(1)",
    style: { transition: "transform 0.1s" }
  };

  // --- Karta dizayni funksiyasi ---
  const renderCard = (service, isFullWidth = false) => (
    <Card 
      hoverable 
      {...btnTouchProps} // Taktil effekt qo'shildi
      onClick={() => {
        if (!isOnline) {
             message.error("Xizmatni tanlash uchun avval 'Onlayn' bo'ling!");
        } else {
             onSelectService(service.key);
        }
      }}
      style={{ 
        borderRadius: 24, 
        border: "none",
        background: isOnline ? service.bg : "#f5f5f5", 
        opacity: isOnline ? 1 : 0.7,
        height: isFullWidth ? 150 : 180, 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center", 
        justifyContent: "center",
        boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
        ...btnTouchProps.style
      }}
      bodyStyle={{ padding: 15, width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      <div style={{ 
        fontSize: 32, 
        color: isOnline ? service.color : "#bfbfbf", 
        marginBottom: 15,
        background: "white", 
        width: 70, 
        height: 70, 
        borderRadius: "50%", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        boxShadow: "0 4px 15px rgba(0,0,0,0.08)"
      }}>
        {service.icon}
      </div>
      <Text strong style={{ fontSize: 16, color: "#333", textAlign: 'center' }}>{service.title}</Text>
    </Card>
  );

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#FFD700', borderRadius: 12 } }}>
      <div style={{ minHeight: "100vh", background: "#fff", padding: "20px", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>

        {/* 1. HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 25 }}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            shape="circle" 
            size="large" 
            onClick={handleExit} 
            {...btnTouchProps}
            style={{ border: 'none', boxShadow: "0 2px 10px rgba(0,0,0,0.1)", ...btnTouchProps.style }}
          />

          <div style={{ background: "#f0f0f0", padding: "6px 16px", borderRadius: 20, fontWeight: "bold", fontSize: 14 }}>
              UZ
          </div>
        </div>

        {/* 2. ENG TEPADA: STATUS PANELI (SWITCH) */}
        <Card 
          style={{ 
            marginBottom: 30, 
            borderRadius: 24, 
            background: isOnline ? "#f6ffed" : "#fff", 
            border: isOnline ? "1px solid #b7eb8f" : "1px solid #f0f0f0",
            boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
            transition: 'all 0.3s'
          }}
          bodyStyle={{ padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Badge status={isOnline ? "success" : "default"} />
                <Title level={4} style={{ margin: 0, color: isOnline ? "#52c41a" : "#8c8c8c", fontWeight: 800 }}>
                  {isOnline ? "ONLAYN" : "OFLAYN"}
                </Title>
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
               {isOnline ? "Buyurtmalar qabul qilinmoqda" : "Ishni boshlash uchun yoqing"}
            </Text>
          </div>

          <Switch 
            checked={isOnline}
            onChange={toggleOnline}
            checkedChildren={<CarOutlined />}
            unCheckedChildren={<PoweroffOutlined />}
            style={{ transform: "scale(1.4)" }} 
          />
        </Card>

        {/* 3. SARLAVHA */}
        <div style={{ marginBottom: 25 }}>
            <Text type="secondary" style={{ fontSize: 16, fontWeight: 500 }}>{t.greeting}</Text>
            <Title level={2} style={{ margin: 0, fontWeight: 900 }}>{t.selectService}</Title>
        </div>

        {/* 4. XIZMATLAR GRID TIZIMI */}

        {/* 1-QATOR (Viloyat & Tuman) */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          {topServices.map((s) => (
            <Col span={12} key={s.key}>
              {renderCard(s)}
            </Col>
          ))}
        </Row>

        {/* 2-QATOR (Yuk & Eltish) */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          {middleServices.map((s) => (
            <Col span={12} key={s.key}>
              {renderCard(s)}
            </Col>
          ))}
        </Row>

        {/* 3-QATOR (Taksi - To'liq ekran) */}
        <Row>
          <Col span={24}>
              {renderCard(taxiService, true)}
          </Col>
        </Row>

      </div>
    </ConfigProvider>
  );
}