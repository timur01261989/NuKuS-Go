import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Typography,
  Row,
  Col,
  Drawer,
  Switch,
  Tag,
  message,
  Card,
  Badge
} from "antd";
import {
  CarOutlined,
  GlobalOutlined,
  RocketOutlined,
  ShopOutlined,
  NotificationOutlined,
  UserOutlined,
  EnvironmentOutlined,
  WalletOutlined,
  SearchOutlined,
  RiseOutlined,
  CheckCircleOutlined,
  SafetyCertificateOutlined
} from "@ant-design/icons";

// Xizmatlar (Services)
import DriverTaxi from "./services/DriverTaxi"; // Yoki DriverMap
import DriverInterDistrict from "./services/DriverInterDistrict";
import DriverInterProvincial from "./services/DriverInterProvincial";
import DriverFreight from "./services/DriverFreight";
import DriverDelivery from "./services/DriverDelivery";

import DriverProfile from "./DriverProfile";
import api from "@/utils/apiHelper"; // API ulash

const { Title, Text } = Typography;

export default function DriverHome({ onLogout }) {
  const navigate = useNavigate();

  // --- STATE ---
  const [selectedService, setSelectedService] = useState(
    localStorage.getItem("driverActiveService") || null
  );
  const [profileOpen, setProfileOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Statistika (Mock data - keyinchalik API dan olinadi)
  const [stats, setStats] = useState({
    todayEarnings: 145000,
    rating: 4.95,
    activity: 98,
    ordersCount: 6
  });

  // Xizmatni saqlash
  useEffect(() => {
    if (selectedService) {
      localStorage.setItem("driverActiveService", selectedService);
    } else {
      localStorage.removeItem("driverActiveService");
    }
  }, [selectedService]);

  // Online statusni o'zgartirish
  const toggleOnline = async (checked) => {
    setLoading(true);
    try {
      // Serverga status yuborish
      // await api.post('/api/driver', { action: 'toggle_online', status: checked });
      
      // Simulyatsiya
      setTimeout(() => {
        setIsOnline(checked);
        message.success(checked ? "Siz Onlaynsiz! Buyurtmalar kutilmoqda." : "Siz Offlaynsiz.");
        setLoading(false);
      }, 800);
    } catch (e) {
      message.error("Xatolik yuz berdi");
      setLoading(false);
    }
  };

  // Tungi rejim (hozircha vizual)
  const toggleDarkMode = () => {
    message.info("Tungi rejim tez kunda ishga tushadi!");
  };

  // --- DRAWER GESTURES ---
  const drawerInnerRef = useRef(null);
  const touchStartY = useRef(null);

  const onProfileTouchStart = (e) => { touchStartY.current = e.touches[0].clientY; };
  const onProfileTouchMove = (e) => {
    if (touchStartY.current !== null && drawerInnerRef.current) {
      const dy = e.touches[0].clientY - touchStartY.current;
      if (dy > 0 && drawerInnerRef.current) drawerInnerRef.current.style.transform = `translateY(${dy}px)`;
    }
  };
  const onProfileTouchEnd = (e) => {
    if (touchStartY.current !== null) {
      const dy = e.changedTouches[0].clientY - touchStartY.current;
      if (dy > 100) setProfileOpen(false);
      else if (drawerInnerRef.current) drawerInnerRef.current.style.transform = "";
      touchStartY.current = null;
    }
  };

  // --- RENDER SERVICES ---
  if (selectedService === "taxi") return <DriverTaxi onBack={() => setSelectedService(null)} />;
  if (selectedService === "inter_district") return <DriverInterDistrict onBack={() => setSelectedService(null)} />;
  if (selectedService === "inter_provincial") return <DriverInterProvincial onBack={() => setSelectedService(null)} />;
  if (selectedService === "freight") return <DriverFreight onBack={() => setSelectedService(null)} />;
  if (selectedService === "delivery") return <DriverDelivery onBack={() => setSelectedService(null)} />;

  // --- MAIN DASHBOARD ---
  return (
    <div style={{ minHeight: "100vh", background: "#f5f6fa", paddingBottom: 40, fontFamily: "sans-serif" }}>
      
      {/* HEADER */}
      <div style={{
        padding: "15px 20px",
        background: "#fff",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
        position: "sticky",
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ 
            width: 40, height: 40, borderRadius: "50%", background: "#111", 
            color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 900, fontSize: 18
          }}>
            N
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>Nukus-Go</div>
            <div style={{ fontSize: 11, color: isOnline ? "#52c41a" : "#999", fontWeight: 600 }}>
              {isOnline ? "● Ishdasiz" : "○ Ish vaqti emas"}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <Button shape="circle" icon={<span style={{fontSize:16}}>🌙</span>} onClick={toggleDarkMode} />
          <Badge count={1} dot>
            <Button shape="circle" icon={<UserOutlined />} onClick={() => setProfileOpen(true)} />
          </Badge>
        </div>
      </div>

      <div style={{ padding: "20px 15px" }}>
        
        {/* 1. STATISTIKA VIDJETI (YANGI!) */}
        <div style={{ marginBottom: 20 }}>
          <div style={{
            background: "linear-gradient(135deg, #1f1f1f 0%, #3a3a3a 100%)",
            borderRadius: 24,
            padding: "20px",
            color: "white",
            boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
            position: "relative",
            overflow: "hidden"
          }}>
            {/* Orqa fon bezagi */}
            <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, background: "rgba(255,255,255,0.05)", borderRadius: "50%" }}></div>

            <Row gutter={16} align="middle">
              <Col span={14}>
                <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 5 }}>Bugungi daromad</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: "#73d13d", letterSpacing: 0.5 }}>
                  {stats.todayEarnings.toLocaleString()} <span style={{fontSize: 14, color: '#fff'}}>so'm</span>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <Tag color="transparent" style={{ border: "1px solid rgba(255,255,255,0.3)", color: "white", borderRadius: 20 }}>
                    {stats.ordersCount} ta buyurtma
                  </Tag>
                </div>
              </Col>
              
              <Col span={10} style={{ textAlign: "right", borderLeft: "1px solid rgba(255,255,255,0.1)" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
                    <StarFilledIcon />
                    <span style={{ fontSize: 20, fontWeight: 800 }}>{stats.rating}</span>
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>Reyting</div>
                  
                  <div style={{ marginTop: 8, fontSize: 12, color: stats.activity > 90 ? "#73d13d" : "#faad14" }}>
                    Faollik: {stats.activity}%
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        </div>

        {/* 2. XABARLAR (YANGI!) */}
        <div style={{ marginBottom: 25 }}>
          <div style={{ 
            background: "#fffbe6", 
            border: "1px solid #ffe58f", 
            borderRadius: 16, 
            padding: "12px 16px", 
            display: "flex", 
            alignItems: "center", 
            gap: 12 
          }}>
            <NotificationOutlined style={{ color: "#faad14", fontSize: 20 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#555" }}>Bonuslar vaqti!</div>
              <div style={{ fontSize: 11, color: "#888" }}>Bugun soat 18:00 dan 21:00 gacha +20% bonus.</div>
            </div>
          </div>
        </div>

        <Title level={4} style={{ marginBottom: 15, paddingLeft: 5 }}>Xizmat turini tanlang</Title>

        {/* 3. XIZMATLAR PANJARASI (Grid) */}
        <Row gutter={[15, 15]}>
          {/* TAXI */}
          <Col span={12}>
            <ServiceCard 
              title="Shahar ichida" 
              subtitle="Taksi" 
              icon={<CarOutlined style={{ fontSize: 32, color: "#1890ff" }} />} 
              onClick={() => setSelectedService("taxi")}
              color="#e6f7ff"
            />
          </Col>
          
          {/* TUMANLAR ARO */}
          <Col span={12}>
            <ServiceCard 
              title="Tumanlar aro" 
              subtitle="Qatnov" 
              icon={<EnvironmentOutlined style={{ fontSize: 32, color: "#52c41a" }} />} 
              onClick={() => setSelectedService("inter_district")}
              color="#f6ffed"
            />
          </Col>

          {/* VILOYATLAR ARO */}
          <Col span={24}>
            <ServiceCard 
              title="Viloyatlar aro" 
              subtitle="Uzoq masofa" 
              icon={<GlobalOutlined style={{ fontSize: 32, color: "#722ed1" }} />} 
              onClick={() => setSelectedService("inter_provincial")} 
              horizontal
              color="#f9f0ff"
            />
          </Col>

          {/* YUK TASHISH */}
          <Col span={12}>
            <ServiceCard 
              title="Yuk tashish" 
              subtitle="Truck" 
              icon={<ShopOutlined style={{ fontSize: 32, color: "#fa8c16" }} />} 
              onClick={() => setSelectedService("freight")}
              color="#fff7e6"
            />
          </Col>

          {/* POCHTA */}
          <Col span={12}>
            <ServiceCard 
              title="Pochta / Eltish" 
              subtitle="Delivery" 
              icon={<RocketOutlined style={{ fontSize: 32, color: "#eb2f96" }} />} 
              onClick={() => setSelectedService("delivery")}
              color="#fff0f6"
            />
          </Col>
        </Row>

      </div>

      {/* 4. PROFIL DRAWER */}
      <Drawer
        placement="right"
        width="85%"
        closable={false}
        onClose={() => setProfileOpen(false)}
        open={profileOpen}
        styles={{ body: { padding: 0 } }}
        maskClosable
      >
        <div
          ref={drawerInnerRef}
          style={{ height: "100%", background: "#fff", display: "flex", flexDirection: "column" }}
          onTouchStart={onProfileTouchStart}
          onTouchMove={onProfileTouchMove}
          onTouchEnd={onProfileTouchEnd}
        >
          {/* Drawer Header */}
          <div style={{ padding: "40px 20px 20px", background: "#111", color: "white" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Title level={3} style={{ color: "white", margin: 0 }}>Profil</Title>
              <Switch 
                checkedChildren="ON" 
                unCheckedChildren="OFF" 
                checked={isOnline} 
                onChange={toggleOnline} 
                loading={loading}
              />
            </div>
            <div style={{ marginTop: 10, opacity: 0.7 }}>Status: {isOnline ? "Aktiv" : "Yashirin"}</div>
          </div>

          <div style={{ flex: 1, overflowY: "auto" }}>
            <DriverProfile
              onBack={() => setProfileOpen(false)}
              onLogout={() => {
                setProfileOpen(false);
                onLogout?.();
              }}
            />
          </div>
        </div>
      </Drawer>

    </div>
  );
}

// --- YORDAMCHI KOMPONENTLAR ---

// Yulduzcha ikonasi (SVG)
const StarFilledIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="#faad14" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
  </svg>
);

// Xizmat Kartochkasi
function ServiceCard({ title, subtitle, icon, onClick, horizontal, color }) {
  return (
    <div 
      onClick={onClick}
      style={{
        background: color || "#fff",
        borderRadius: 24,
        padding: "20px",
        height: horizontal ? "auto" : 160,
        display: "flex",
        flexDirection: horizontal ? "row" : "column",
        justifyContent: "space-between",
        alignItems: horizontal ? "center" : "flex-start",
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
        transition: "transform 0.1s",
        boxShadow: "0 4px 15px rgba(0,0,0,0.05)"
      }}
      onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.97)"}
      onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
      onTouchStart={(e) => e.currentTarget.style.transform = "scale(0.97)"}
      onTouchEnd={(e) => e.currentTarget.style.transform = "scale(1)"}
    >
      <div style={{ zIndex: 2 }}>
        <div style={{ 
          width: 50, height: 50, borderRadius: 16, background: "white", 
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: horizontal ? 0 : 15,
          marginRight: horizontal ? 15 : 0,
          boxShadow: "0 4px 10px rgba(0,0,0,0.05)"
        }}>
          {icon}
        </div>
        
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#333" }}>{title}</div>
          <div style={{ fontSize: 12, color: "#888", fontWeight: 600 }}>{subtitle}</div>
        </div>
      </div>

      {/* Orqa fon bezagi */}
      <div style={{
        position: "absolute",
        bottom: -20, right: -20,
        opacity: 0.1,
        transform: "scale(1.5)"
      }}>
        {icon}
      </div>
    </div>
  );
}