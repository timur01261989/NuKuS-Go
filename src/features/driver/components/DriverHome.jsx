import React, { useState, useEffect } from "react";
import { Button, Card, Typography, Row, Col, message, Drawer } from "antd"; // Drawer qo'shildi
import { 
  ArrowLeftOutlined, CarOutlined, GlobalOutlined, 
  RocketOutlined, ShopOutlined, NotificationOutlined, UserOutlined,
  EnvironmentOutlined
} from "@ant-design/icons";

// --- SAHIFALAR VA XIZMATLAR ---
import DriverTaxi from "./services/DriverTaxi"; 
import DriverInterDistrict from "./services/DriverInterDistrict"; 
import DriverInterProvincial from "./services/DriverInterProvincial";
import DriverFreight from "./services/DriverFreight";
import DriverDelivery from "./services/DriverDelivery";

// PROFAL KOMPONENTI (Buni src/components/driver/ ichida yaratganmiz deb hisoblaymiz)
import DriverProfile from "./DriverProfile"; 

const { Title, Text } = Typography;

export default function DriverHome({ onLogout }) {
  // Holatni saqlash
  const [selectedService, setSelectedService] = useState(localStorage.getItem("driverActiveService") || null);
  const [profileOpen, setProfileOpen] = useState(false); // Profil oynasi holati

  // Xizmatni tanlash funksiyasi
  const selectService = (key) => {
      setSelectedService(key);
      localStorage.setItem("driverActiveService", key);
  };

  // Menyuga qaytish funksiyasi
  const backToMenu = () => {
      setSelectedService(null);
      localStorage.removeItem("driverActiveService");
  };

  const btnTouchProps = {
    onMouseDown: (e) => e.currentTarget.style.transform = "scale(0.97)",
    onMouseUp: (e) => e.currentTarget.style.transform = "scale(1)",
    onTouchStart: (e) => e.currentTarget.style.transform = "scale(0.97)",
    onTouchEnd: (e) => e.currentTarget.style.transform = "scale(1)",
    style: { transition: "transform 0.1s" }
  };

  // --- MANTIQ: QAYSI XIZMAT TANLANGAN BO'LSA, O'SHANI KO'RSATAMIZ ---
  if (selectedService === "taxi") return <DriverTaxi onBack={backToMenu} />;
  if (selectedService === "interDist") return <DriverInterDistrict onBack={backToMenu} />;
  if (selectedService === "interProv") return <DriverInterProvincial onBack={backToMenu} />;
  if (selectedService === "freight") return <DriverFreight onBack={backToMenu} />;
  if (selectedService === "delivery") return <DriverDelivery onBack={backToMenu} />;

  // --- ASOSIY MENYU ---
  return (
      <div style={{ padding: "20px", background: "#f8f9fa", minHeight: "100vh", fontFamily: 'YangoHeadline, sans-serif' }}>

        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 25 }}>
           <Button 
              onClick={onLogout} 
              icon={<ArrowLeftOutlined />} 
              shape="circle" 
              size="large"
              style={{ background: "#fff", border: "none", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }}
           />

           <div style={{ textAlign: 'center' }}>
              <Title level={5} style={{ margin: 0, fontWeight: 800 }}>HAYDOVCHI</Title>
              <Text type="secondary" style={{ fontSize: 12 }}>Xizmat turini tanlang</Text>
           </div>

           <div style={{ display: 'flex', gap: 10 }}>
              <Button icon={<NotificationOutlined />} shape="circle" size="large" style={{ background: "#fff", border: "none", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }} />

              {/* PROFIL TUGMASI */}
              <Button 
                icon={<UserOutlined />} 
                shape="circle" 
                size="large" 
                onClick={() => setProfileOpen(true)} // Profilni ochish
                style={{ background: "#FFD700", border: "none", boxShadow: "0 4px 10px rgba(0,0,0,0.1)", color: '#000' }} 
              />
           </div>
        </div>

        {/* MENYU KARTOCHKALARI */}
        <Row gutter={[15, 15]}>
           <Col span={24}>
              <Card 
                hoverable 
                onClick={() => selectService('taxi')} 
                style={{ borderRadius: 24, textAlign: 'center', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', background: 'linear-gradient(135deg, #ffffff 0%, #fffbe6 100%)', cursor: 'pointer' }} 
                {...btnTouchProps}
              >
                  <div style={{ background: '#FFD700', width: 60, height: 60, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px', boxShadow: '0 4px 10px rgba(255, 215, 0, 0.4)' }}>
                      <CarOutlined style={{ fontSize: 30, color: '#000' }} />
                  </div>
                  <Title level={4} style={{ margin: 0 }}>Shahar ichida Taksi</Title>
                  <Text type="secondary">Buyurtmalarni qabul qilish</Text>
              </Card>
           </Col>

           <Col span={12}>
              <Card hoverable onClick={() => selectService('interProv')} style={{ borderRadius: 20, textAlign: 'center', height: '100%', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', cursor: 'pointer' }} {...btnTouchProps}>
                  <GlobalOutlined style={{ fontSize: 30, color: '#1890ff', marginBottom: 15 }} />
                  <div style={{ fontWeight: 'bold', fontSize: 15 }}>Viloyatlar aro</div>
              </Card>
           </Col>

           <Col span={12}>
              <Card hoverable onClick={() => selectService('interDist')} style={{ borderRadius: 20, textAlign: 'center', height: '100%', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', cursor: 'pointer' }} {...btnTouchProps}>
                  <EnvironmentOutlined style={{ fontSize: 30, color: '#52c41a', marginBottom: 15 }} />
                  <div style={{ fontWeight: 'bold', fontSize: 15 }}>Tumanlar aro</div>
              </Card>
           </Col>

           <Col span={12}>
              <Card hoverable onClick={() => selectService('freight')} style={{ borderRadius: 20, textAlign: 'center', height: '100%', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', cursor: 'pointer' }} {...btnTouchProps}>
                  <ShopOutlined style={{ fontSize: 30, color: '#faad14', marginBottom: 15 }} />
                  <div style={{ fontWeight: 'bold', fontSize: 15 }}>Yuk tashish</div>
              </Card>
           </Col>

           <Col span={12}>
              <Card hoverable onClick={() => selectService('delivery')} style={{ borderRadius: 20, textAlign: 'center', height: '100%', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', cursor: 'pointer' }} {...btnTouchProps}>
                  <RocketOutlined style={{ fontSize: 30, color: '#eb2f96', marginBottom: 15 }} />
                  <div style={{ fontWeight: 'bold', fontSize: 15 }}>Eltish xizmati</div>
              </Card>
           </Col>
        </Row>

        {/* --- PROFIL OYNASI (DRAWER) --- */}
        <Drawer
          placement="right"
          width="100%" 
          closable={false}
          onClose={() => setProfileOpen(false)}
          open={profileOpen}
          styles={{ body: { padding: 0 } }} // Ant Design 5.x uslubi
        >
          <DriverProfile 
            onBack={() => setProfileOpen(false)} 
            onLogout={() => {
              setProfileOpen(false);
              onLogout(); // Asosiy logout funksiyasini chaqirish
            }}
          />
        </Drawer>

      </div>
  );
}