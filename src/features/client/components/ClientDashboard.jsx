import React, { useState, useEffect } from "react";
import { Card, Button, Typography, Row, Col, ConfigProvider, Skeleton } from "antd";
import { 
  GlobalOutlined, EnvironmentOutlined, CarOutlined, 
  RocketOutlined, ShopOutlined, ArrowLeftOutlined 
} from "@ant-design/icons";
import { translations } from '@i18n/translations';
import { supabase } from "../../../lib/supabase";

// Xizmatlarni import qilamiz
import ClientInterProvincial from "./ClientInterProvincial";
import ClientInterDistrict from "./ClientInterDistrict";
import ClientFreight from "./ClientFreight";
import ClientDelivery from "./ClientDelivery";
import ClientTaxi from "./ClientTaxi";
import { AutoMarketPreview } from '../../market/components/AutoMarketPreview.jsx';
import { AutoMarketPanel } from '../../market/components/AutoMarketPanel.jsx';

const { Title, Text } = Typography;

export default function ClientDashboard({ onBackToMain }) {
  const [marketOpen, setMarketOpen] = React.useState(false);

  const savedLang = localStorage.getItem("appLang") || "uz_lotin";
  const t = translations[savedLang] || translations["uz_lotin"];

  const [selectedService, setSelectedService] = useState(null);
  const [loading, setLoading] = useState(true); // Skeleton uchun
const renderContent = () => {
    // ...
    switch (currentView) {
      
      // ...
      
      case "taxi":
        // 👇 Yangi komponentni shu yerga qo'yamiz
        return <ClientTaxiPage onBack={() => setCurrentView("dashboard")} />;

      // ...
    }
  };
  // Dastlabki yuklanish effekti
  useEffect(() => {
    setTimeout(() => setLoading(false), 800);
  }, []);

  // Tanlangan xizmatga o'tish
  if (selectedService === "interProv") return <ClientInterProvincial onBack={() => setSelectedService(null)} />;
  if (selectedService === "interDist") return <ClientInterDistrict onBack={() => setSelectedService(null)} />;
  if (selectedService === "freight") return <ClientFreight onBack={() => setSelectedService(null)} />;
  if (selectedService === "delivery") return <ClientDelivery onBack={() => setSelectedService(null)} />;
  if (selectedService === "taxi") return <ClientTaxi onBack={() => setSelectedService(null)} />;

  const menuItems = [
    { key: "taxi", title: t.taxi || "Taksi", icon: <CarOutlined />, color: "#faad14", bg: "#fff7e6" },
    { key: "interDist", title: t.interDistrict, icon: <EnvironmentOutlined />, color: "#52c41a", bg: "#f6ffed" },
    { key: "interProv", title: t.interProvincial, icon: <GlobalOutlined />, color: "#1890ff", bg: "#e6f7ff" },
    { key: "delivery", title: t.delivery, icon: <RocketOutlined />, color: "#722ed1", bg: "#f9f0ff" },
    { key: "freight", title: t.freight, icon: <ShopOutlined />, color: "#fa541c", bg: "#fff2e8" },
  ];

  // Tugma bosilganda kichrayish effekti
  const btnTouchProps = {
    onMouseDown: (e) => e.currentTarget.style.transform = "scale(0.96)",
    onMouseUp: (e) => e.currentTarget.style.transform = "scale(1)",
    onTouchStart: (e) => e.currentTarget.style.transform = "scale(0.96)",
    onTouchEnd: (e) => e.currentTarget.style.transform = "scale(1)",
    style: { transition: "transform 0.1s" }
  };

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#1890ff', borderRadius: 16 } }}>
      <div style={{ padding: "20px", background: "#f8f9fa", minHeight: "100vh", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>

        {/* HEADER */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 30 }}>
           <Button 
             icon={<ArrowLeftOutlined />} 
             shape="circle" 
             size="large"
             onClick={onBackToMain} 
             style={{ border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginRight: 15 }}
           />
           <Title level={4} style={{ margin: 0, fontWeight: 800 }}>Nukus Go</Title>
        </div>

        <div style={{ marginBottom: 25 }}>
           <Text type="secondary" style={{ fontSize: 16 }}>Xizmat turini tanlang</Text>
           <Title level={2} style={{ margin: 0, fontWeight: 900 }}>Qayerga boramiz?</Title>
        </div>

        {/* LOADING SKELETON */}
        {loading ? (
           <Row gutter={[16, 16]}>
              {[1, 2, 3, 4, 5].map(i => (
                 <Col span={12} key={i}>
                    <Card style={{ borderRadius: 24, height: 160, border: 'none' }}>
                       <Skeleton active avatar paragraph={{ rows: 2 }} />
                    </Card>
                 </Col>
              ))}
           </Row>
        ) : (
          <Row gutter={[16, 16]}>
            {menuItems.map(item => (
              <Col span={item.key === 'taxi' ? 24 : 12} key={item.key}>
                <Card 
                  hoverable 
                  onClick={() => setSelectedService(item.key)}
                  {...btnTouchProps}
                  style={{ 
                    textAlign: "center", borderRadius: 24, 
                    height: item.key === 'taxi' ? 160 : 180, 
                    display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
                    boxShadow: "0 8px 20px rgba(0,0,0,0.04)", border: 'none',
                    ...btnTouchProps.style
                  }}
                >
                  <div style={{ 
                    fontSize: 32, color: item.color, marginBottom: 15,
                    background: item.bg, width: 70, height: 70, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: 'inset 0 0 10px rgba(0,0,0,0.05)'
                  }}>
                    {item.icon}
                  </div>
                  <Text strong style={{ fontSize: 16 }}>{item.title}</Text>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      {/* Avto savdo: preview list (scroll down) */}
      <AutoMarketPreview onOpenMarket={() => setMarketOpen(true)} />
      <AutoMarketPanel open={marketOpen} onClose={() => setMarketOpen(false)} />
      </div>
    </ConfigProvider>
  );
}