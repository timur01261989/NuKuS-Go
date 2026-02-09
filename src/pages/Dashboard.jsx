import React, { useState, useEffect } from "react";
import { 
  Card, Row, Col, Typography, Button, Drawer, Avatar, List, 
  Space, message, Dropdown, ConfigProvider, Skeleton 
} from "antd";
import {
  MenuOutlined, UserOutlined, HomeOutlined, HistoryOutlined, 
  SettingOutlined, LogoutOutlined, CarOutlined, ContainerOutlined, 
  RocketOutlined, GlobalOutlined, MessageOutlined, GiftOutlined,
  UserAddOutlined, CustomerServiceOutlined, SwapOutlined, EnvironmentOutlined,
  NotificationOutlined, FireOutlined, ShopOutlined, RightOutlined
} from "@ant-design/icons";

// YANGI IMPORTLAR (Navigatsiya va Supabase uchun)
import { useNavigate } from "react-router-dom"; 
import { supabase } from "./supabase"; 

import { translations } from "./translations";

// --- KOMPONENTLAR ---
// DIQQAT: Bu yerda DriverHome o'rniga DriverAuth qo'shildi
import DriverAuth from "../components/driver/DriverAuth"; 

import ClientInterProvincial from "../components/client/ClientInterProvincial"; 
import ClientInterDistrict from "../components/client/ClientInterDistrict"; 
import ClientFreight from "../components/client/ClientFreight"; 
import ClientDelivery from "../components/client/ClientDelivery"; 
import ClientOrderCreate from "../components/client/ClientOrderCreate"; 

// --- RASMLAR ---
import taxiImg from "../assets/taxi.jpg";
import cityImg from "../assets/city.jpg";
import villageImg from "../assets/village.jpg";
import truckImg from "../assets/truck.jpg";
import deliveryImg from "../assets/delivery.jpg";
// Dashboard.jsx dan namuna
import { Typography } from 'antd';
const { Title } = Typography;

export default function Dashboard() {
  return (
    <div style={{ padding: '20px' }}>
      <Title 
        level={2} 
        className="yango-title" 
        style={{ color: '#000', marginBottom: '24px' }}
      >
        Nukus Go
      </Title>
const { Text, Title } = Typography;

export default function Dashboard() {
  const navigate = useNavigate(); // Navigatsiya uchun
  const [open, setOpen] = useState(false);
  const [currentView, setCurrentView] = useState("dashboard");
  const [loading, setLoading] = useState(true);

  const savedLang = localStorage.getItem("appLang") || "uz_lotin";
  const [langKey, setLangKey] = useState(savedLang); 
  const t = translations[langKey] || translations["uz_lotin"];

  useEffect(() => {
    // Sessiyani tekshirish (Agar sessiya yo'q bo'lsa, login sahifasiga otib yuboradi)
    const checkSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            navigate("/");
        }
    };
    checkSession();

    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, [navigate]);

  const getLabel = (key) => {
    const labels = { uz_lotin: "UZ", uz_kirill: "ЎЗ", qq_lotin: "QQ", qq_kirill: "ҚҚ", ru: "RU", en: "EN" };
    return labels[key] || "UZ";
  };

  const [currentLangText, setCurrentLangText] = useState(getLabel(savedLang));

  const languages = [
    { key: 'uz_lotin', label: "O'zbek (Lotin)" },
    { key: 'uz_kirill', label: "Ўзбек (Кирилл)" },
    { key: 'qq_lotin', label: "Qaraqalpaq (Lotin)" },
    { key: 'qq_kirill', label: "Қарақалпақ (Кирилл)" },
    { key: 'ru', label: "Русский" },
    { key: 'en', label: "English" }
  ];

  const handleLangChange = ({ key }) => {
    setLangKey(key);
    localStorage.setItem("appLang", key);
    setCurrentLangText(getLabel(key));
    message.success("Til o'zgartirildi");
  };

  // --- HAQIQIY LOGOUT FUNKSIYASI ---
  const handleLogout = async () => {
    try {
        setLoading(true);
        // 1. Supabase sessiyasini uzish (ENG MUHIMI SHU)
        const { error } = await supabase.auth.signOut();
        if (error) throw error;

        // 2. Lokal xotirani tozalash
        localStorage.clear();

        // 3. Login sahifasiga yo'naltirish
        message.success("Tizimdan muvaffaqiyatli chiqildi");
        navigate("/"); 
    } catch (err) {
        console.error("Chiqishda xatolik:", err);
        message.error("Xatolik yuz berdi");
    } finally {
        setLoading(false);
    }
  };

  // --- SAHIFALAR ALMASHINUVI ---
  // DIQQAT: Bu yerda endi DriverAuth chaqiriladi (u o'zi tekshiradi: Ro'yxatdan o'tishmi yoki Ish stolimi)
  if (currentView === "driver") return <DriverAuth onBack={() => setCurrentView("dashboard")} />;

  if (currentView === "taxi") return <ClientOrderCreate onBack={() => setCurrentView("dashboard")} />;
  if (currentView === "interProv") return <ClientInterProvincial onBack={() => setCurrentView("dashboard")} />;
  if (currentView === "interDist") return <ClientInterDistrict onBack={() => setCurrentView("dashboard")} />;
  if (currentView === "freight") return <ClientFreight onBack={() => setCurrentView("dashboard")} />;
  if (currentView === "delivery") return <ClientDelivery onBack={() => setCurrentView("dashboard")} />;

  const services = [
    { key: "taxi", title: t?.taxi || "Taksi buyurtma", span: 24, icon: <CarOutlined style={{ fontSize: 28 }} />, image: taxiImg },
    { key: "interProv", title: t?.interProvincial || "Viloyatlar aro", span: 12, icon: <GlobalOutlined style={{ fontSize: 24 }} />, image: cityImg },
    { key: "interDist", title: t?.interDistrict || "Tumanlar aro", span: 12, icon: <EnvironmentOutlined style={{ fontSize: 24 }} />, image: villageImg },
    { key: "freight", title: t?.freight || "Yuk tashish", span: 12, icon: <ContainerOutlined style={{ fontSize: 24 }} />, image: truckImg },
    { key: "delivery", title: t?.delivery || "Eltish xizmati", span: 12, icon: <RocketOutlined style={{ fontSize: 24 }} />, image: deliveryImg },
  ];

  const adsList = [
    { id: 1, type: "gradient", bg: "linear-gradient(135deg, #FFD700, #FFA500)", title: "50% CHEGIRMA!", desc: "Birinchi 3 ta yurish uchun.", icon: <FireOutlined style={{ fontSize: 30, opacity: 0.9 }} />, textColor: "#000" },
    { id: 2, type: "gradient", bg: "linear-gradient(135deg, #52c41a, #95de64)", title: "Haydovchi bo'ling!", desc: "Daromad topishni boshlang.", icon: <CarOutlined style={{ fontSize: 30, opacity: 0.9, color: "#fff" }} />, textColor: "#fff" },
    { id: 3, type: "image", bg: "url('https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1000&auto=format&fit=crop')", title: "EVOS - Mazali taomlar", desc: "Hamkorimizdan buyurtma.", icon: <ShopOutlined style={{ fontSize: 25, color: "#fff" }} />, textColor: "#fff" },
    { id: 4, type: "solid", bg: "#f0f5ff", title: "Do'stingizni chaqiring", desc: "Bonuslarga ega bo'ling.", icon: <UserAddOutlined style={{ fontSize: 25, color: "#1890ff" }} />, textColor: "#000" },
  ];

  const sidebarMenu = [
    { key: "driver", icon: <SwapOutlined />, title: t?.workAsDriver || "Haydovchi bo'lib ishlash", color: "#52c41a", bold: true },
    { key: "address", icon: <HomeOutlined />, title: t?.myAddress || "Mening manzilim" },
    { key: "history", icon: <HistoryOutlined />, title: t?.history || "Tarix" },
    { key: "bonus", icon: <GiftOutlined />, title: t?.bonuses || "Bonuslar", color: "#faad14" },
    { key: "referral", icon: <UserAddOutlined />, title: t?.referral || "Do'stlarni chaqirish" },
    { key: "chat", icon: <MessageOutlined />, title: t?.chat || "Chat" },
    { key: "support", icon: <CustomerServiceOutlined />, title: t?.support || "Qo'llab-quvvatlash" },
    { key: "settings", icon: <SettingOutlined />, title: t?.settings || "Sozlamalar" },
  ];

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#FFD700', borderRadius: 12 } }}>
      <div style={{ 
        padding: "20px", background: "#f8f9fa", minHeight: "100vh", 
        paddingBottom: "120px", overflowY: "auto", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' 
      }}>

        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <Button type="text" shape="circle" size="large" style={{ background: "#fff", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} icon={<MenuOutlined style={{ fontSize: 20 }} />} onClick={() => setOpen(true)} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
             <Button type="text" shape="circle" size="large" style={{ background: "#fff", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} icon={<NotificationOutlined style={{ fontSize: 20 }} />} onClick={() => message.info("Bildirishnomalar yo'q")} />
            <Dropdown menu={{ items: languages, onClick: handleLangChange }} trigger={['click']}>
              <Button size="large" icon={<GlobalOutlined />} shape="round" style={{ fontWeight: 700, boxShadow: "0 4px 12px rgba(0,0,0,0.08)", border: 'none' }}>
                {currentLangText}
              </Button>
            </Dropdown>
          </div>
        </div>

        {/* SALOMLASHISH */}
        <div style={{ marginBottom: 20 }}>
          {loading ? (
             <Skeleton active paragraph={{ rows: 1 }} />
          ) : (
            <>
              <Title level={5} style={{ margin: 0, opacity: 0.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>{t?.greeting || "Xayrli kun!"}</Title>
              <Title level={2} style={{ margin: 0, fontWeight: 900, color: '#222' }}>Nukus Go</Title>
            </>
          )}
        </div>

        {/* XIZMATLAR GRID */}
        <Row gutter={[12, 12]} style={{ marginBottom: 30 }}>
          {services.map((service) => (
            <Col span={service.span} key={service.key}>
              {loading ? (
                 <Skeleton.Button active block style={{ height: service.key === 'taxi' ? 180 : 130, borderRadius: 24 }} />
              ) : (
                <Card hoverable bordered={false} style={{ height: service.key === 'taxi' ? 180 : 130, borderRadius: "24px", overflow: "hidden", position: "relative", border: "none", boxShadow: "0 8px 20px rgba(0,0,0,0.06)", transition: "transform 0.1s" }} bodyStyle={{ padding: 0, height: "100%" }} onClick={() => setCurrentView(service.key)}
                  onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.98)"} onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"} onTouchStart={(e) => e.currentTarget.style.transform = "scale(0.98)"} onTouchEnd={(e) => e.currentTarget.style.transform = "scale(1)"}
                >
                  <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundImage: `url(${service.image})`, backgroundSize: "cover", backgroundPosition: "center" }} />
                  <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.1) 60%)", zIndex: 1 }} />
                  <div style={{ position: "relative", zIndex: 2, height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "16px", color: "#fff" }} >
                    <div style={{ background: "rgba(255,255,255,0.2)", width: 48, height: 48, borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10, backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.1)" }}>
                      {service.icon}
                    </div>
                    <Text strong style={{ color: "#fff", fontSize: 17, lineHeight: 1.2 }}>{service.title}</Text>
                  </div>
                </Card>
              )}
            </Col>
          ))}
        </Row>

        {/* REKLAMALAR */}
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
             <Title level={5} style={{ margin: 0, fontWeight: 700 }}>{t?.offersForYou || "Maxsus takliflar"}</Title>
             <RightOutlined style={{ fontSize: 12, opacity: 0.5 }} />
          </div>

          <div style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "10px", scrollSnapType: "x mandatory", msOverflowStyle: "none", scrollbarWidth: "none" }}>
            {loading ? (
               [1,2,3].map(i => <Skeleton.Button key={i} active style={{ width: 160, height: 100, borderRadius: 16 }} />)
            ) : (
              adsList.map((ad) => (
                <div key={ad.id} onClick={() => message.info("Aksiya ochildi")} 
                  style={{ minWidth: "160px", height: "100px", borderRadius: "16px", background: ad.type === 'image' ? 'transparent' : ad.bg, position: 'relative', overflow: 'hidden', cursor: 'pointer', boxShadow: "0 4px 12px rgba(0,0,0,0.1)", scrollSnapAlign: "start", transition: "transform 0.1s" }}
                  onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.95)"} onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"} onTouchStart={(e) => e.currentTarget.style.transform = "scale(0.95)"} onTouchEnd={(e) => e.currentTarget.style.transform = "scale(1)"}
                >
                   {ad.type === 'image' && (
                    <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundImage: ad.bg, backgroundSize: "cover", backgroundPosition: "center" }}>
                       <div style={{ width: "100%", height: "100%", background: "rgba(0,0,0,0.4)" }} />
                    </div>
                   )}
                   <div style={{ position: "relative", zIndex: 2, padding: "12px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                      <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.2)', padding: 5, borderRadius: '50%', backdropFilter: 'blur(4px)' }}>
                        {ad.icon}
                      </div>
                      <div>
                        <Text strong style={{ color: ad.textColor, display: "block", lineHeight: 1.2, fontSize: 13 }}>{ad.title}</Text>
                        <Text style={{ color: ad.textColor, fontSize: 10, opacity: 0.8 }}>{ad.desc}</Text>
                      </div>
                   </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div style={{ marginTop: 20, padding: "20px", textAlign: "center", border: "1px dashed #ddd", borderRadius: "12px", color: "#999" }}>
            <Text type="secondary">Yana reklamalar joylash uchun bo'sh joy...</Text>
        </div>

        {/* SIDEBAR DRAWER (YON MENU) */}
        <Drawer placement="left" onClose={() => setOpen(false)} open={open} width={280} closable={false} bodyStyle={{ padding: 0 }}>
          <div style={{ textAlign: "center", padding: "60px 20px 30px", background: "linear-gradient(135deg, #FFD700, #FFC107)", borderRadius: "0 0 30px 30px" }}>
            <Avatar size={70} icon={<UserOutlined />} style={{ border: "4px solid rgba(255,255,255,0.6)", marginBottom: 10, background: "#fff", color: "#000" }} />
            <Title level={4} style={{ margin: 0, color: "#000" }}>Timur Xalmuratov</Title>
            <Text style={{ opacity: 0.7, color: "#000", fontWeight: 500 }}>+998 90 123 45 67</Text>
          </div>

          <List style={{ padding: "15px" }} dataSource={sidebarMenu} renderItem={(item) => (
              <List.Item style={{ padding: "12px 15px", cursor: "pointer", border: "none", borderRadius: "12px", marginBottom: 5, transition: "background 0.2s" }}
                onClick={() => {
                   if (item.key === "driver") setCurrentView("driver");
                   else message.info("Tez kunda...");
                   setOpen(false);
                }}
              >
                <Space size="middle">
                  <span style={{ fontSize: 20, color: item.color || "#555" }}>{item.icon}</span>
                  <div>
                    <Text strong={item.bold} style={{ display: "block", fontSize: 15, color: "#333" }}>{item.title}</Text>
                  </div>
                </Space>
              </List.Item>
            )}
          />

          {/* CHIQISH TUGMASI (Endi haqiqiy logout qiladi) */}
          <div style={{ padding: "20px" }}>
             <Button danger block type="text" icon={<LogoutOutlined />} onClick={handleLogout} style={{ height: 45, borderRadius: 12, fontWeight: "bold", background: "#fff1f0", color: "#ff4d4f" }}>
                {t?.logout || "Chiqish"}
             </Button>
          </div>
        </Drawer>
      </div>
    </ConfigProvider>
  );
}