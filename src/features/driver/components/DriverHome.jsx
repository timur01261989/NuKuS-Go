import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { appConfig } from "../../../shared/config/appConfig";
import { Button, Card, Typography, Row, Col, Drawer } from "antd";
import {
  ArrowLeftOutlined,
  CarOutlined,
  GlobalOutlined,
  RocketOutlined,
  ShopOutlined,
  NotificationOutlined,
  UserOutlined,
  EnvironmentOutlined,
  WalletOutlined,
  ToolOutlined,
  SearchOutlined,
} from "@ant-design/icons";

// --- SAHIFALAR VA XIZMATLAR ---
import DriverTaxi from "./services/DriverTaxi";
import DriverInterDistrict from "./services/DriverInterDistrict";
import DriverInterProvincial from "./services/DriverInterProvincial";
import DriverFreight from "./services/DriverFreight";
import DriverDelivery from "./services/DriverDelivery";

// PROFIL KOMPONENTI
import DriverProfile from "./DriverProfile";

const { Title, Text } = Typography;

export default function DriverHome({ onLogout }) {
  const navigate = useNavigate();

  // Holatni saqlash
  const [selectedService, setSelectedService] = useState(
    localStorage.getItem("driverActiveService") || null
  );
  const [profileOpen, setProfileOpen] = useState(false);

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

  // ✅ MUHIM TUZATISH:
  // Oldin btnTouchProps ichidagi `style` spread qilinsa Card/Button style'larini bosib yuborardi.
  // Shu sabab style ni olib tashladik, faqat handlerlar qoldi.
  const btnTouchProps = {
    onMouseDown: (e) => {
      e.currentTarget.style.transform = "scale(0.97)";
    },
    onMouseUp: (e) => {
      e.currentTarget.style.transform = "scale(1)";
    },
    onMouseLeave: (e) => {
      e.currentTarget.style.transform = "scale(1)";
    },
    onTouchStart: (e) => {
      e.currentTarget.style.transform = "scale(0.97)";
    },
    onTouchEnd: (e) => {
      e.currentTarget.style.transform = "scale(1)";
    },
  };

  // --- MANTIQ: QAYSI XIZMAT TANLANGAN BO'LSA, O'SHANI KO'RSATAMIZ ---
  if (selectedService === "taxi") return <DriverTaxi onBack={backToMenu} />;
  if (selectedService === "interDist")
    return <DriverInterDistrict onBack={backToMenu} />;
  if (selectedService === "interProv")
    return <DriverInterProvincial onBack={backToMenu} />;
  if (selectedService === "freight") return <DriverFreight onBack={backToMenu} />;
  if (selectedService === "delivery") return <DriverDelivery onBack={backToMenu} />;

  // --- ASOSIY MENYU ---
  return (
    <div
      style={{
        padding: "20px",
        background: "var(--bg-layout)",
        minHeight: "100vh",
        color: "var(--text)",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 25,
        }}
      >
        <Button
          onClick={() => onLogout?.()}
          icon={<ArrowLeftOutlined />}
          shape="circle"
          size="large"
          style={{
            background: "var(--field-bg)",
            border: "1px solid var(--field-border)",
            boxShadow: "var(--shadow-soft)",
            transition: "transform 0.1s",
            color: "var(--card-text)",
          }}
          {...btnTouchProps}
        />

        <div style={{ textAlign: "center" }}>
          <Title level={5} style={{ margin: 0, fontWeight: 800, color: "var(--text)" }}>
            HAYDOVCHI
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Xizmat turini tanlang
          </Text>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Button
            icon={<NotificationOutlined />}
            shape="circle"
            size="large"
            style={{
              background: "var(--field-bg)",
              border: "1px solid var(--field-border)",
              boxShadow: "var(--shadow-soft)",
              transition: "transform 0.1s",
              color: "var(--card-text)",
            }}
            {...btnTouchProps}
          />

          {/* PROFIL TUGMASI */}
          <Button
            icon={<UserOutlined />}
            shape="circle"
            size="large"
            onClick={() => setProfileOpen(true)}
            style={{
              background: "var(--brand)",
              border: "none",
              boxShadow: "var(--shadow-soft)",
              color: "#000",
              transition: "transform 0.1s",
            }}
            {...btnTouchProps}
          />
        </div>
      </div>

      {/* MENYU KARTOCHKALARI */}
      <Row gutter={[15, 15]}>
        <Col span={24}>
          <Card
            hoverable
            onClick={() => selectService("taxi")}
            style={{
              borderRadius: 24,
              textAlign: "center",
              cursor: "pointer",
              transition: "transform 0.1s",
              border: "1px solid var(--card-border)",
              background: "var(--card-bg)",
              boxShadow: "var(--shadow-soft)",
            }}
            {...btnTouchProps}
          >
            <div
              style={{
                background: "var(--brand)",
                width: 60,
                height: 60,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 15px",
                boxShadow: "0 4px 10px rgba(255, 215, 0, 0.35)",
              }}
            >
              <CarOutlined style={{ fontSize: 30, color: "#000" }} />
            </div>
            <Title level={4} style={{ margin: 0 }}>
              Shahar ichida Taksi
            </Title>
            <Text type="secondary">Buyurtmalarni qabul qilish</Text>
          </Card>
        </Col>

        <Col span={12}>
          <Card
            hoverable
            onClick={() => selectService("interProv")}
            style={{
              borderRadius: 20,
              textAlign: "center",
              height: "100%",
              cursor: "pointer",
              transition: "transform 0.1s",
              border: "1px solid var(--card-border)",
              background: "var(--card-bg)",
              boxShadow: "var(--shadow-soft)",
            }}
            {...btnTouchProps}
          >
            <GlobalOutlined style={{ fontSize: 30, color: "#1890ff", marginBottom: 15 }} />
            <div style={{ fontWeight: "bold", fontSize: 15 }}>Viloyatlar aro</div>
          </Card>
        </Col>

        <Col span={12}>
          <Card
            hoverable
            onClick={() => selectService("interDist")}
            style={{
              borderRadius: 20,
              textAlign: "center",
              height: "100%",
              cursor: "pointer",
              transition: "transform 0.1s",
              border: "1px solid var(--card-border)",
              background: "var(--card-bg)",
              boxShadow: "var(--shadow-soft)",
            }}
            {...btnTouchProps}
          >
            <EnvironmentOutlined style={{ fontSize: 30, color: "#52c41a", marginBottom: 15 }} />
            <div style={{ fontWeight: "bold", fontSize: 15 }}>Tumanlar aro</div>
          </Card>
        </Col>

        <Col span={12}>
          <Card
            hoverable
            onClick={() => selectService("freight")}
            style={{
              borderRadius: 20,
              textAlign: "center",
              height: "100%",
              cursor: "pointer",
              transition: "transform 0.1s",
              border: "1px solid var(--card-border)",
              background: "var(--card-bg)",
              boxShadow: "var(--shadow-soft)",
            }}
            {...btnTouchProps}
          >
            <ShopOutlined style={{ fontSize: 30, color: "#faad14", marginBottom: 15 }} />
            <div style={{ fontWeight: "bold", fontSize: 15 }}>Yuk tashish</div>
          </Card>
        </Col>

        <Col span={12}>
          <Card
            hoverable
            onClick={() => selectService("delivery")}
            style={{
              borderRadius: 20,
              textAlign: "center",
              height: "100%",
              cursor: "pointer",
              transition: "transform 0.1s",
              border: "1px solid var(--card-border)",
              background: "var(--card-bg)",
              boxShadow: "var(--shadow-soft)",
            }}
            {...btnTouchProps}
          >
            <RocketOutlined style={{ fontSize: 30, color: "#eb2f96", marginBottom: 15 }} />
            <div style={{ fontWeight: "bold", fontSize: 15 }}>Eltish xizmati</div>
          </Card>
        </Col>
      </Row>

      {/* SUPER PRO (qo‘shimcha menyu) */}
      <div style={{ marginTop: 18 }}>
        <Card
          style={{
            borderRadius: 24,
            border: "1px solid var(--card-border)",
            background: "var(--card-bg)",
            boxShadow: "var(--shadow-soft)",
          }}
        >
          <Title level={5} style={{ marginTop: 0 }}>
            Super Pro
          </Title>

          <Row gutter={[12, 12]}>
            {appConfig.features.garage && (
              <Col span={8}>
                <Button
                  block
                  icon={<ToolOutlined />}
                  onClick={() => navigate("/garage")}
                  style={{ transition: "transform 0.1s" }}
                  {...btnTouchProps}
                >
                  Garage
                </Button>
              </Col>
            )}

            {appConfig.features.payments && (
              <Col span={8}>
                <Button
                  block
                  icon={<WalletOutlined />}
                  onClick={() => navigate("/payments")}
                  style={{ transition: "transform 0.1s" }}
                  {...btnTouchProps}
                >
                  To‘lov
                </Button>
              </Col>
            )}

            {appConfig.features.searchOnRoute && (
              <Col span={8}>
                <Button
                  block
                  icon={<SearchOutlined />}
                  onClick={() => navigate("/search-route")}
                  style={{ transition: "transform 0.1s" }}
                  {...btnTouchProps}
                >
                  Yo‘lda
                </Button>
              </Col>
            )}
          </Row>

          <Text type="secondary" style={{ fontSize: 12 }}>
            Eslatma: bu bo‘limlar scaffold. Keyin backend va POI manba bilan ulaysiz.
          </Text>
        </Card>
      </div>

      {/* --- PROFIL OYNASI (DRAWER) --- */}
      <Drawer
        placement="right"
        width="100%"
        closable={false}
        onClose={() => setProfileOpen(false)}
        open={profileOpen}
        styles={{ body: { padding: 0 } }}
      >
        <DriverProfile
          onBack={() => setProfileOpen(false)}
          onLogout={() => {
            setProfileOpen(false);
            onLogout?.();
          }}
        />
      </Drawer>
    </div>
  );
}
