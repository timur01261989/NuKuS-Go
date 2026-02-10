import React, { useState, useEffect } from "react";
import {
  Card, Row, Col, Button, Drawer, Avatar, List,
  Space, message, Dropdown, ConfigProvider, Skeleton, Typography
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
import DriverAuth from "../features/driver/components/DriverAuth";

import ClientInterProvincial from "../features/client/components/ClientInterProvincial";
import ClientInterDistrict from "../features/client/components/ClientInterDistrict";
import ClientFreight from "../features/client/components/ClientFreight";
import ClientDelivery from "../features/client/components/ClientDelivery";
import ClientOrderCreate from "../features/client/components/ClientOrderCreate";

// --- RASMLAR ---
import taxiImg from "../assets/taxi.jpg";
import cityImg from "../assets/city.jpg";
import villageImg from "../assets/village.jpg";
import truckImg from "../assets/truck.jpg";
import deliveryImg from "../assets/delivery.jpg";

const { Title, Text } = Typography;

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

  const toggleDrawer = () => setOpen(!open);

  // Tilni almashtirish
  const changeLang = (newLang) => {
    setLangKey(newLang);
    localStorage.setItem("appLang", newLang);
    message.success(t.languageChanged);
  };

  // Logout
  const logout = async () => {
    await supabase.auth.signOut();
    message.success(t.loggedOut);
    navigate("/");
  };

  // Yon menyu elementlari
  const menuItems = [
    { key: "dashboard", icon: <HomeOutlined />, label: t.dashboard },
    { key: "orders", icon: <HistoryOutlined />, label: t.ordersHistory },
    { key: "settings", icon: <SettingOutlined />, label: t.settings },
    { key: "support", icon: <CustomerServiceOutlined />, label: t.support },
    { key: "logout", icon: <LogoutOutlined />, label: t.logout, danger: true, onClick: logout },
  ];

  const langMenu = {
    items: [
      { key: "uz_lotin", label: "O‘zbek (lotin)", onClick: () => changeLang("uz_lotin") },
      { key: "uz_kiril", label: "Ўзбек (кирил)", onClick: () => changeLang("uz_kiril") },
      { key: "ru", label: "Русский", onClick: () => changeLang("ru") },
    ],
  };

  // Bosh sahifadagi xizmat kartalari
  const services = [
    {
      key: "taxi",
      title: t.taxi,
      desc: t.taxiDesc,
      icon: <CarOutlined style={{ fontSize: 28 }} />,
      img: taxiImg,
      view: "taxi",
      color: "#FFD700",
    },
    {
      key: "interProv",
      title: t.interProvincial,
      desc: t.interProvincialDesc,
      icon: <GlobalOutlined style={{ fontSize: 28 }} />,
      img: cityImg,
      view: "interProvincial",
      color: "#4CAF50",
    },
    {
      key: "interDist",
      title: t.interDistrict,
      desc: t.interDistrictDesc,
      icon: <EnvironmentOutlined style={{ fontSize: 28 }} />,
      img: villageImg,
      view: "interDistrict",
      color: "#2196F3",
    },
    {
      key: "freight",
      title: t.freight,
      desc: t.freightDesc,
      icon: <ContainerOutlined style={{ fontSize: 28 }} />,
      img: truckImg,
      view: "freight",
      color: "#FF5722",
    },
    {
      key: "delivery",
      title: t.delivery,
      desc: t.deliveryDesc,
      icon: <RocketOutlined style={{ fontSize: 28 }} />,
      img: deliveryImg,
      view: "delivery",
      color: "#9C27B0",
    },
    {
      key: "driver",
      title: t.driverMode,
      desc: t.driverModeDesc,
      icon: <UserAddOutlined style={{ fontSize: 28 }} />,
      img: cityImg,
      view: "driver",
      color: "#3F51B5",
    },
    {
      key: "chat",
      title: t.chat,
      desc: t.chatDesc,
      icon: <MessageOutlined style={{ fontSize: 28 }} />,
      img: taxiImg,
      view: "chat",
      color: "#00BCD4",
    },
    {
      key: "promo",
      title: t.promotions,
      desc: t.promotionsDesc,
      icon: <GiftOutlined style={{ fontSize: 28 }} />,
      img: villageImg,
      view: "promo",
      color: "#E91E63",
    },
    {
      key: "market",
      title: t.autoMarket,
      desc: t.autoMarketDesc,
      icon: <ShopOutlined style={{ fontSize: 28 }} />,
      img: truckImg,
      view: "market",
      color: "#607D8B",
    },
    {
      key: "popular",
      title: t.popularServices,
      desc: t.popularServicesDesc,
      icon: <FireOutlined style={{ fontSize: 28 }} />,
      img: deliveryImg,
      view: "popular",
      color: "#FF9800",
    },
    {
      key: "notify",
      title: t.notifications,
      desc: t.notificationsDesc,
      icon: <NotificationOutlined style={{ fontSize: 28 }} />,
      img: taxiImg,
      view: "notify",
      color: "#795548",
    },
    {
      key: "switch",
      title: t.switchService,
      desc: t.switchServiceDesc,
      icon: <SwapOutlined style={{ fontSize: 28 }} />,
      img: cityImg,
      view: "switch",
      color: "#8BC34A",
    },
  ];

  const renderDashboard = () => (
    <>
      <Row gutter={[16, 16]}>
        {services.map((s) => (
          <Col xs={24} sm={12} md={8} lg={6} key={s.key}>
            <Card
              hoverable
              style={{
                borderRadius: 20,
                overflow: "hidden",
                border: `1px solid ${s.color}33`,
              }}
              onClick={() => setCurrentView(s.view)}
              cover={
                <div style={{ height: 120, background: `url(${s.img}) center/cover no-repeat` }} />
              }
            >
              <Space align="center">
                <Avatar style={{ background: s.color }} icon={s.icon} />
                <div>
                  <Title level={5} style={{ margin: 0 }}>
                    {s.title}
                  </Title>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {s.desc}
                  </Text>
                </div>
              </Space>
              <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
                <RightOutlined />
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div style={{ padding: 20 }}>
          <Skeleton active paragraph={{ rows: 10 }} />
        </div>
      );
    }

    switch (currentView) {
      case "taxi":
        return <ClientOrderCreate onBack={() => setCurrentView("dashboard")} />;
      case "interProvincial":
        return <ClientInterProvincial onBack={() => setCurrentView("dashboard")} />;
      case "interDistrict":
        return <ClientInterDistrict onBack={() => setCurrentView("dashboard")} />;
      case "freight":
        return <ClientFreight onBack={() => setCurrentView("dashboard")} />;
      case "delivery":
        return <ClientDelivery onBack={() => setCurrentView("dashboard")} />;
      case "driver":
        return <DriverAuth onBack={() => setCurrentView("dashboard")} />;
      case "chat":
        return (
          <div style={{ padding: 20 }}>
            <Title level={4}>{t.chat}</Title>
            <Text type="secondary">{t.chatComingSoon}</Text>
          </div>
        );
      case "promo":
        return (
          <div style={{ padding: 20 }}>
            <Title level={4}>{t.promotions}</Title>
            <Text type="secondary">{t.promotionsComingSoon}</Text>
          </div>
        );
      case "market":
        return (
          <div style={{ padding: 20 }}>
            <Title level={4}>{t.autoMarket}</Title>
            <Text type="secondary">{t.autoMarketComingSoon}</Text>
          </div>
        );
      case "popular":
        return (
          <div style={{ padding: 20 }}>
            <Title level={4}>{t.popularServices}</Title>
            <Text type="secondary">{t.popularServicesComingSoon}</Text>
          </div>
        );
      case "notify":
        return (
          <div style={{ padding: 20 }}>
            <Title level={4}>{t.notifications}</Title>
            <Text type="secondary">{t.notificationsComingSoon}</Text>
          </div>
        );
      case "switch":
        return (
          <div style={{ padding: 20 }}>
            <Title level={4}>{t.switchService}</Title>
            <Text type="secondary">{t.switchServiceComingSoon}</Text>
          </div>
        );
      default:
        return renderDashboard();
    }
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#FFD700",
          borderRadius: 14,
          fontFamily: "YangoHeadline, Inter, system-ui, sans-serif",
        },
      }}
    >
      <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
        {/* Header */}
        <div
          style={{
            height: 60,
            background: "#fff",
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
            borderBottom: "1px solid #eee",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={toggleDrawer}
            style={{ marginRight: 10 }}
          />
          <Title level={5} style={{ margin: 0, flex: 1 }}>
            {t.appName}
          </Title>

          <Dropdown menu={langMenu} placement="bottomRight" trigger={["click"]}>
            <Button type="text" icon={<GlobalOutlined />} />
          </Dropdown>
        </div>

        {/* Drawer menu */}
        <Drawer
          title={
            <Space>
              <Avatar icon={<UserOutlined />} />
              <div>
                <div style={{ fontWeight: 700 }}>{t.menu}</div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {t.chooseSection}
                </Text>
              </div>
            </Space>
          }
          placement="left"
          onClose={toggleDrawer}
          open={open}
          bodyStyle={{ padding: 0 }}
        >
          <List
            dataSource={menuItems}
            renderItem={(item) => (
              <List.Item
                style={{
                  cursor: "pointer",
                  padding: "12px 16px",
                  color: item.danger ? "#ff4d4f" : "inherit",
                }}
                onClick={() => {
                  setOpen(false);
                  if (item.onClick) {
                    item.onClick();
                  } else {
                    setCurrentView(item.key);
                  }
                }}
              >
                <Space>
                  {item.icon}
                  <span>{item.label}</span>
                </Space>
              </List.Item>
            )}
          />
        </Drawer>

        {/* Content */}
        <div style={{ padding: 16 }}>
          {renderContent()}
        </div>
      </div>
    </ConfigProvider>
  );
}
