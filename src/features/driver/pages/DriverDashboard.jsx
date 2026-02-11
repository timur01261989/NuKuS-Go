import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, Drawer, Space, Typography, Divider, Switch, Tag, message } from "antd";
import {
  MenuOutlined,
  CarOutlined,
  EnvironmentOutlined,
  RocketOutlined,
  SettingOutlined,
  HistoryOutlined,
  CustomerServiceOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { supabase } from "@lib/supabase";
import { useLanguage } from "@shared/i18n/useLanguage";

const { Title, Text } = Typography;

function initials(name) {
  const s = String(name || "").trim();
  if (!s) return "D";
  const parts = s.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("") || "D";
}

export default function DriverDashboard() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profile, setProfile] = useState({ fullName: "", avatarUrl: "" });

  // ✅ Active service badge uchun
  const [activeService, setActiveService] = useState(
    () => localStorage.getItem("driverActiveService") || ""
  );

  // ✅ Online / Offline indikator
  const [isOnline, setIsOnline] = useState(() => {
    const v = localStorage.getItem("driverOnline");
    return v === "1";
  });

  // Drawer swipe-close uchun refs
  const drawerInnerRef = useRef(null);
  const touchRef = useRef({ startX: 0, dx: 0, dragging: false });

  const drawerWidth = 300;
  const swipeThreshold = 90; // px

  const services = useMemo(
    () => [
      { key: "taxi", path: "/driver/taxi", icon: <CarOutlined />, title: t?.cityTaxi || "Shahar ichida taksi" },
      { key: "interProv", path: "/driver/inter-provincial", icon: <EnvironmentOutlined />, title: t?.interProv || "Viloyatlar aro" },
      { key: "interDist", path: "/driver/inter-district", icon: <RocketOutlined />, title: t?.interDistrict || "Tumanlar aro" },
      { key: "freight", path: "/driver/freight", icon: <RocketOutlined />, title: t?.freight || "Yuk tashish" },
      { key: "delivery", path: "/driver/delivery", icon: <RocketOutlined />, title: t?.delivery || "Eltish xizmati" },
    ],
    [t]
  );

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { data: u, error: uErr } = await supabase.auth.getUser();
        if (uErr) throw uErr;

        const user = u?.user;
        if (!user) return;

        let fullName = user.user_metadata?.full_name || user.user_metadata?.name || "";
        let avatarUrl = user.user_metadata?.avatar_url || "";

        // profiles jadvalidan ham o‘qib ko‘ramiz (bo‘lsa)
        try {
          const { data: p } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("id", user.id)
            .single();

          if (p?.full_name) fullName = p.full_name;
          if (p?.avatar_url) avatarUrl = p.avatar_url;
        } catch {
          // ignore
        }

        if (mounted) setProfile({ fullName: fullName || "Haydovchi", avatarUrl: avatarUrl || "" });
      } catch {
        // ignore
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Drawer ichidagi tugmalar bosilganda
  const go = (path) => {
    setDrawerOpen(false);
    setTimeout(() => navigate(path), 0);
  };

  // Card tanlanganda active service saqlaymiz
  const goService = (serviceKey, path) => {
    setActiveService(serviceKey);
    localStorage.setItem("driverActiveService", serviceKey);
    navigate(path);
  };

  // Online / Offline toggle (local + backendga urinib ko‘ramiz)
  const toggleOnline = async (next) => {
    setIsOnline(next);
    localStorage.setItem("driverOnline", next ? "1" : "0");

    try {
      const { data: u } = await supabase.auth.getUser();
      const user = u?.user;
      if (!user) return;

      // ✅ Schema har xil bo‘lishi mumkin, shuning uchun bir nechta maydonni yuboramiz.
      // Ustun bo‘lmasa Supabase error qaytarishi mumkin — biz UI'ni buzmaymiz.
      await supabase
        .from("drivers")
        .update({
          is_online: next,
          online: next,
          status: next ? "online" : "offline",
          last_seen_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      message.success(next ? (t?.online || "Online") : (t?.offline || "Offline"));
    } catch {
      // ignore
    }
  };

  // Kichik "pro" touch animatsiya
  const btnTouchProps = {
    onMouseDown: (e) => (e.currentTarget.style.transform = "scale(0.985)"),
    onMouseUp: (e) => (e.currentTarget.style.transform = "scale(1)"),
    onMouseLeave: (e) => (e.currentTarget.style.transform = "scale(1)"),
    onTouchStart: (e) => (e.currentTarget.style.transform = "scale(0.985)"),
    onTouchEnd: (e) => (e.currentTarget.style.transform = "scale(1)"),
  };

  // ✅ Drawer swipe-close (chapga surilsa yopiladi)
  const onDrawerTouchStart = (e) => {
    if (!drawerInnerRef.current) return;
    const x = e.touches?.[0]?.clientX ?? 0;
    touchRef.current = { startX: x, dx: 0, dragging: true };

    drawerInnerRef.current.style.transition = "none";
  };

  const onDrawerTouchMove = (e) => {
    if (!drawerInnerRef.current) return;
    if (!touchRef.current.dragging) return;

    const x = e.touches?.[0]?.clientX ?? 0;
    const dx = x - touchRef.current.startX; // chapga surilsa dx < 0
    touchRef.current.dx = dx;

    // Faqat chapga (yopish tomonga) siljitishga ruxsat
    const translate = Math.max(-drawerWidth, Math.min(0, dx));
    drawerInnerRef.current.style.transform = `translateX(${translate}px)`;
  };

  const onDrawerTouchEnd = () => {
    if (!drawerInnerRef.current) return;

    const { dx } = touchRef.current;
    touchRef.current.dragging = false;

    drawerInnerRef.current.style.transition = "transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1)";

    if (dx < -swipeThreshold) {
      // Yetarlicha chapga surildi => yopamiz
      drawerInnerRef.current.style.transform = `translateX(-${drawerWidth}px)`;
      setTimeout(() => setDrawerOpen(false), 160);
    } else {
      // Qaytib joyiga
      drawerInnerRef.current.style.transform = "translateX(0px)";
    }
  };

  // Drawer yopilganda transform reset
  useEffect(() => {
    if (!drawerOpen && drawerInnerRef.current) {
      drawerInnerRef.current.style.transition = "none";
      drawerInnerRef.current.style.transform = "translateX(0px)";
    }
  }, [drawerOpen]);

  return (
    <div style={{ minHeight: "100vh", background: "#f5f6f8" }}>
      {/* HEADER */}
      <div
        style={{
          height: 56,
          display: "flex",
          alignItems: "center",
          padding: "0 14px",
          background: "#111",
          color: "white",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <Button
          type="text"
          onClick={() => setDrawerOpen(true)}
          icon={<MenuOutlined style={{ color: "white", fontSize: 20 }} />}
          style={{ transition: "transform 0.12s" }}
          {...btnTouchProps}
        />

        <div style={{ flex: 1, textAlign: "center", fontWeight: 900 }}>
          {t?.driver || "Haydovchi"}
        </div>

        {/* ✅ Online/Offline indikator (header o‘ng tomonda) */}
        <div
          onClick={() => toggleOnline(!isOnline)}
          role="button"
          tabIndex={0}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 10px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.10)",
            cursor: "pointer",
            userSelect: "none",
            transition: "transform 0.12s",
          }}
          {...btnTouchProps}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: isOnline ? "#52c41a" : "#8c8c8c",
              boxShadow: isOnline ? "0 0 0 3px rgba(82,196,26,0.20)" : "none",
            }}
          />
          <span style={{ fontSize: 12, fontWeight: 800 }}>
            {isOnline ? (t?.online || "Online") : (t?.offline || "Offline")}
          </span>
        </div>
      </div>

      {/* BODY */}
      <div style={{ padding: 14, maxWidth: 560, margin: "0 auto" }}>
        <Title level={4} style={{ marginTop: 10, marginBottom: 12 }}>
          {t?.chooseService || "Xizmat turini tanlang"}
        </Title>

        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          {services.map((s) => {
            const active = activeService === s.key;
            return (
              <Card
                key={s.key}
                hoverable
                style={{
                  borderRadius: 16,
                  transition: "transform 0.12s, box-shadow 0.12s, border-color 0.12s",
                  boxShadow: active ? "0 10px 24px rgba(0,0,0,0.10)" : undefined,
                  border: active ? "1px solid rgba(82,196,26,0.35)" : "1px solid rgba(0,0,0,0.04)",
                }}
                onClick={() => goService(s.key, s.path)}
                {...btnTouchProps}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <Space>
                    {s.icon}
                    <div>
                      <Text strong>{s.title}</Text>
                      <br />
                      <Text type="secondary">
                        {t?.ordersInThisSection || "Buyurtmalar shu bo‘limda chiqadi"}
                      </Text>
                    </div>
                  </Space>

                  {/* ✅ Active badge */}
                  {active && (
                    <Tag
                      color="green"
                      style={{
                        marginTop: 2,
                        borderRadius: 999,
                        fontWeight: 800,
                        padding: "2px 10px",
                      }}
                    >
                      {t?.active || "Active"}
                    </Tag>
                  )}
                </div>
              </Card>
            );
          })}
        </Space>

        {/* Pastda kichik active info (ixtiyoriy) */}
        {activeService && (
          <div style={{ marginTop: 12, textAlign: "center" }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {t?.currentService || "Hozirgi xizmat"}:{" "}
              <Text strong>
                {services.find((x) => x.key === activeService)?.title || activeService}
              </Text>
            </Text>
          </div>
        )}
      </div>

      {/* DRAWER */}
      <Drawer
        placement="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={drawerWidth}
        bodyStyle={{ padding: 0 }}
        // Mask closable swipe bilan birga yaxshi ishlaydi
        maskClosable
      >
        {/* Swipe close uchun wrapper */}
        <div
          ref={drawerInnerRef}
          style={{ height: "100%", background: "#fff", willChange: "transform" }}
          onTouchStart={onDrawerTouchStart}
          onTouchMove={onDrawerTouchMove}
          onTouchEnd={onDrawerTouchEnd}
        >
          <div style={{ padding: 16, background: "#111", color: "white" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: "#FFD700",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  color: "#111",
                  overflow: "hidden",
                }}
              >
                {profile.avatarUrl ? (
                  <img
                    alt="avatar"
                    src={profile.avatarUrl}
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: 12,
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                ) : (
                  initials(profile.fullName)
                )}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 900 }}>{profile.fullName || "Haydovchi"}</div>
                <div style={{ opacity: 0.85, fontSize: 12 }}>{t?.driver || "Haydovchi"}</div>
              </div>

              {/* ✅ Online/Offline switch drawer ichida ham */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                <div style={{ fontSize: 11, opacity: 0.85, marginBottom: 4 }}>
                  {isOnline ? (t?.online || "Online") : (t?.offline || "Offline")}
                </div>
                <Switch size="small" checked={isOnline} onChange={toggleOnline} />
              </div>
            </div>
          </div>

          <div style={{ padding: 12, position: "relative", minHeight: "calc(100vh - 80px)" }}>
            <Button
              block
              icon={<SettingOutlined />}
              style={{ height: 44, borderRadius: 12, textAlign: "left" }}
              onClick={() => go("/settings")}
            >
              {t?.settings || "Sozlamalar"}
            </Button>

            <Button
              block
              icon={<HistoryOutlined />}
              style={{ height: 44, borderRadius: 12, textAlign: "left", marginTop: 8 }}
              onClick={() => go("/driver/orders")}
            >
              {t?.orderHistoryDriver || "Buyurtmalar tarixi"}
            </Button>

            <Divider style={{ margin: "12px 0" }} />

            {/* ✅ Active service chip drawer ichida */}
            {activeService && (
              <div style={{ marginBottom: 10 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {t?.currentService || "Hozirgi xizmat"}:
                </Text>{" "}
                <Tag
                  color="green"
                  style={{ borderRadius: 999, fontWeight: 800, padding: "2px 10px", marginLeft: 6 }}
                >
                  {services.find((x) => x.key === activeService)?.title || activeService}
                </Tag>
              </div>
            )}

            <div style={{ position: "absolute", left: 12, right: 12, bottom: 12 }}>
              <Button
                block
                icon={<CustomerServiceOutlined />}
                style={{ height: 44, borderRadius: 12, textAlign: "left" }}
                onClick={() => go("/support")}
              >
                {t?.support || "Qo‘llab-quvvatlash"}
              </Button>

              <Button
                danger
                block
                icon={<LogoutOutlined />}
                style={{ height: 44, borderRadius: 12, textAlign: "left", marginTop: 8 }}
                onClick={() => go("/logout")}
              >
                {t?.logout || "Chiqish"}
              </Button>
            </div>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
