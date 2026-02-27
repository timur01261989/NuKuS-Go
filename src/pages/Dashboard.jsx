import React, { useState, useEffect } from "react";
import {
  Card, Button, Drawer, Avatar, List,
  Space, message, Dropdown, ConfigProvider, Skeleton, Typography, Switch, Segmented
} from "antd";
import {
  MenuOutlined, UserOutlined, HomeOutlined, HistoryOutlined,
  SettingOutlined, LogoutOutlined, CarOutlined, ContainerOutlined,
  RocketOutlined, GlobalOutlined, MessageOutlined, GiftOutlined,
  UserAddOutlined, CustomerServiceOutlined, SwapOutlined, EnvironmentOutlined,
  NotificationOutlined, FireOutlined, ShopOutlined, RightOutlined
} from "@ant-design/icons";

import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import ClientDashboard from "../features/client/components/ClientDashboard";

import { translations } from "@i18n/translations";

// --- KOMPONENTLAR ---
import DriverAuth from "../features/driver/components/DriverAuth";
import ClientInterProvincial from "../features/client/intercity/ClientIntercityPage";
import ClientInterDistrict from "../features/client/interDistrict/ClientInterDistrictPage";
import ClientFreight from "../features/client/freight/ClientFreightPage";
import ClientDelivery from "../features/client/delivery/DeliveryPage";
import ClientOrderCreate from "../features/client/components/ClientOrderCreate";

// --- RASMLAR ---
import taxiImg from "../assets/taxi.jpg";
import cityImg from "../assets/city.jpg";
import villageImg from "../assets/village.jpg";
import truckImg from "../assets/truck.jpg";
import deliveryImg from "../assets/delivery.jpg";

const { Title, Text } = Typography;

function applyNightModeClass(enabled) {
  if (enabled) document.body.classList.add("night-mode-active");
  else document.body.classList.remove("night-mode-active");
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [currentView, setCurrentView] = useState("dashboard");
  const [loading, setLoading] = useState(true);

  const savedLang = (localStorage.getItem("unigo_lang") || "uz").toLowerCase();
  const [langKey, setLangKey] = useState(savedLang);
  const dictKey = langKey === "qk" ? "qq_lotin" : langKey === "uz" ? "uz_lotin" : langKey;
  const t = translations[dictKey] || translations["uz_lotin"];

  // ✅ Night mode mode: "auto" | "on" | "off"
  const [nightMode, setNightMode] = useState("auto");

  // localStorage’dan o‘qish
  useEffect(() => {
    const saved = localStorage.getItem("nightMode");
    if (saved === "on" || saved === "off" || saved === "auto") {
      setNightMode(saved);
    } else {
      setNightMode("auto");
      localStorage.setItem("nightMode", "auto");
    }
  }, []);

  // night mode qo‘llash
  useEffect(() => {
    localStorage.setItem("nightMode", nightMode);

    if (nightMode === "on") {
      applyNightModeClass(true);
      return;
    }
    if (nightMode === "off") {
      applyNightModeClass(false);
      return;
    }

    // AUTO
    const updateAuto = () => {
      const hour = new Date().getHours();
      const enabled = hour >= 20 || hour < 6;
      applyNightModeClass(enabled);
    };

    updateAuto();
    const interval = setInterval(updateAuto, 60 * 1000);
    return () => clearInterval(interval);
  }, [nightMode]);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) navigate("/");
    };
    checkSession();

    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, [navigate]);

  const toggleDrawer = () => setOpen(!open);

  const changeLang = (newLang) => {
    const next = (newLang || "uz").toLowerCase();
    setLangKey(next);
    localStorage.setItem("unigo_lang", next);
    window.dispatchEvent(new CustomEvent("unigoLangChanged", { detail: { key: next } }));
    message.success(t?.languageChanged || "Til o'zgartirildi");
  };

  const logout = async () => {
    await supabase.auth.signOut();
    message.success(t.loggedOut);
    navigate("/");
  };

  const menuItems = [
    { key: "dashboard", icon: <HomeOutlined />, label: t.dashboard },
    { key: "orders", icon: <HistoryOutlined />, label: t.ordersHistory },
    { key: "settings", icon: <SettingOutlined />, label: t.settings },
    { key: "support", icon: <CustomerServiceOutlined />, label: t.support },
    { key: "logout", icon: <LogoutOutlined />, label: t.logout, danger: true, onClick: logout },
  ];

  const langMenu = {
    items: [
      { key: "qk", label: "Qaraqalpaqsha", onClick: () => changeLang("qk") },
      { key: "uz", label: "O‘zbekcha", onClick: () => changeLang("uz") },
      { key: "ru", label: "Русский", onClick: () => changeLang("ru") },
      { key: "en", label: "English", onClick: () => changeLang("en") },
    ],
  };

  // Eski grid (qoladi)
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
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 16,
        }}
      >
        {services.map((s) => (
          <Card
            key={s.key}
            hoverable
            style={{
              borderRadius: 20,
              overflow: "hidden",
              border: `1px solid ${s.color}33`,
              width: "100%",
            }}
            onClick={() => setCurrentView(s.view)}
            cover={
              <div
                style={{
                  height: 120,
                  background: `url(${s.img}) center/cover no-repeat`,
                }}
              />
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
        ))}
      </div>
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
      case "dashboard":
        return <ClientDashboard onBackToMain={() => navigate("/main")} />;

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

      case "orders":
        return (
          <div style={{ padding: 20 }}>
            <Title level={4}>{t.ordersHistory}</Title>
            <Text type="secondary">
              Bu bo‘lim hali ulanmagan. Bu yerga buyurtmalar tarixini chiqaramiz.
            </Text>
            <div style={{ marginTop: 14 }}>
              <Button type="primary" onClick={() => setCurrentView("dashboard")}>
                {t.dashboard}
              </Button>
            </div>
          </div>
        );

      case "settings":
        return (
          <div style={{ padding: 20 }}>
            <Title level={4}>{t.settings}</Title>
            <Text type="secondary">
              Bu bo‘limda profil, til, tungi rejim va boshqa sozlamalar bo‘ladi.
            </Text>

            {/* ✅ TUNGI REJIM BLOKI (TO‘LIQ) */}
            <div
              style={{
                marginTop: 18,
                padding: 14,
                borderRadius: 14,
                background: "#fff",
                border: "1px solid #eee",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column" }}>
                <Text strong>Tungi rejim</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Auto (20:00–06:00) yoki qo‘lda ON/OFF
                </Text>

                <div style={{ marginTop: 10 }}>
                  <Segmented
                    value={nightMode}
                    onChange={(val) => setNightMode(val)}
                    options={[
                      { label: "Auto", value: "auto" },
                      { label: "On", value: "on" },
                      { label: "Off", value: "off" },
                    ]}
                  />
                </div>
              </div>

              <Switch
                checked={nightMode === "on"}
                onChange={(v) => setNightMode(v ? "on" : "off")}
              />
            </div>

            <div style={{ marginTop: 14 }}>
              <Button onClick={() => setCurrentView("dashboard")}>
                {t.dashboard}
              </Button>
            </div>
          </div>
        );

      case "support":
        return (
          <div style={{ padding: 20 }}>
            <Title level={4}>{t.support}</Title>
            <Text type="secondary">
              Qo‘llab-quvvatlash bo‘limi. Telefon/Telegram/Chat qo‘shiladi.
            </Text>
            <div style={{ marginTop: 14 }}>
              <Button onClick={() => setCurrentView("dashboard")}>
                {t.dashboard}
              </Button>
            </div>
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
                  if (item.onClick) item.onClick();
                  else setCurrentView(item.key);
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
           <ClientDashboard /> 
        </div>
      </div>
    </ConfigProvider>
  );
}
