import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Card,
  Drawer,
  Space,
  Typography,
  Divider,
  Switch,
  Tag,
  message,
} from "antd";
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
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@lib/supabase";
import { useLanguage } from "@shared/i18n/useLanguage";

import { startTracking } from "../components/services/locationService";

const { Title, Text } = Typography;

function initials(name) {
  const s = String(name || "").trim();
  if (!s) return "D";
  const parts = s.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("") || "D";
}

export default function DriverDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profile, setProfile] = useState({ fullName: "", avatarUrl: "" });

  const [isOnline, setIsOnline] = useState(() => {
    const v = localStorage.getItem("driverOnline");
    return v === "1";
  });

  // =========================
  // ACTIVE SERVICE (route-based)
  // =========================
  const activeService = useMemo(() => {
    const p = String(location?.pathname || "");
    if (p.startsWith("/driver/taxi")) return "taxi";
    if (p.startsWith("/driver/inter-provincial")) return "interProv";
    if (p.startsWith("/driver/inter-district")) return "interDist";
    if (p.startsWith("/driver/freight")) return "freight";
    if (p.startsWith("/driver/delivery")) return "delivery";
    return "";
  }, [location?.pathname]);

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

  // =========================
  // PROFILE load
  // =========================
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

    return () => { mounted = false; };
  }, []);

  // =========================
  // UI helpers
  // =========================
  const go = (path) => {
    setDrawerOpen(false);
    setTimeout(() => navigate(path), 0);
  };

  const btnTouchProps = {
    onMouseDown: (e) => (e.currentTarget.style.transform = "scale(0.985)"),
    onMouseUp: (e) => (e.currentTarget.style.transform = "scale(1)"),
    onMouseLeave: (e) => (e.currentTarget.style.transform = "scale(1)"),
    onTouchStart: (e) => (e.currentTarget.style.transform = "scale(0.985)"),
    onTouchEnd: (e) => (e.currentTarget.style.transform = "scale(1)"),
  };

  // =========================
  // ONLINE tracking
  // =========================
  const API_BASE = (import.meta?.env?.VITE_API_BASE || "").replace(/\/$/, "");

  const lastGeoRef = useRef({ lat: null, lng: null, bearing: null, speed: null });
  const watchIdRef = useRef(null);
  const heartbeatTimerRef = useRef(null);
  const userIdRef = useRef(null);

  const postJson = async (path, body) => {
    const r = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || j?.ok === false) {
      const msg = j?.error || `HTTP ${r.status}`;
      throw new Error(msg);
    }
    return j;
  };

  const sendDriverState = async (driver_user_id, nextOnline) => {
    const state = nextOnline ? "online" : "offline";
    try {
      await postJson("/api/driver-state", { driver_user_id, state });
    } catch {
      // ignore
    }
  };

  const sendHeartbeat = async (driver_user_id, nextOnline) => {
    const { lat, lng, bearing } = lastGeoRef.current || {};
    try {
      await postJson("/api/driver-heartbeat", {
        driver_user_id,
        is_online: !!nextOnline,
        lat: lat ?? undefined,
        lng: lng ?? undefined,
        bearing: bearing ?? undefined,
      });
    } catch {
      // ignore
    }
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null && watchIdRef.current !== undefined) {
      try {
        navigator.geolocation?.clearWatch?.(watchIdRef.current);
      } catch {
        // ignore
      }
    }
    watchIdRef.current = null;

    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
  };

  const startOnlineLoop = async (userId) => {
    await sendDriverState(userId, true);

    const watchId = startTracking((pos) => {
      lastGeoRef.current = {
        lat: pos?.lat ?? null,
        lng: pos?.lng ?? null,
        bearing: pos?.heading ?? null,
        speed: pos?.speed ?? null,
      };
    });

    watchIdRef.current = watchId ?? null;

    await sendHeartbeat(userId, true);

    heartbeatTimerRef.current = setInterval(() => {
      const uid = userIdRef.current;
      if (!uid) return;
      sendHeartbeat(uid, true);
    }, 15000);
  };

  const toggleOnline = async (next) => {
    setIsOnline(next);
    localStorage.setItem("driverOnline", next ? "1" : "0");

    try {
      const { data: u, error: uErr } = await supabase.auth.getUser();
      if (uErr) throw uErr;
      const user = u?.user;
      if (!user) return;

      userIdRef.current = user.id;

      try {
        await supabase
          .from("drivers")
          .update({
            is_online: next,
            online: next,
            status: next ? "online" : "offline",
            last_seen_at: new Date().toISOString(),
          })
          .eq("id", user.id);
      } catch {
        // ignore
      }

      await sendDriverState(user.id, next);

      message.success(next ? (t?.online || "Online") : (t?.offline || "Offline"));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data: u } = await supabase.auth.getUser();
        const user = u?.user;
        if (!user) return;

        userIdRef.current = user.id;

        if (!isOnline) {
          await sendDriverState(user.id, false);
          stopTracking();
          return;
        }

        stopTracking();
        await startOnlineLoop(user.id);

        if (cancelled) stopTracking();
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
      stopTracking();
    };
  }, [isOnline]);

  // =========================
  // LEFT DRAWER swipe-close (rubber band + velocity)
  // =========================
  const drawerWidth = 300;
  const drawerInnerRef = useRef(null);
  const rafRef = useRef(0);

  const touchRef = useRef({
    dragging: false,
    startX: 0,
    lastX: 0,
    dx: 0,
    lastT: 0,
    velocity: 0,
  });

  const rubberBandLeft = (dx, maxLeft) => {
    if (dx >= maxLeft) return dx;
    return maxLeft - Math.abs(dx - maxLeft) * 0.35;
  };

  const setDrawerTranslate = (px, withTransition) => {
    const el = drawerInnerRef.current;
    if (!el) return;
    el.style.transition = withTransition
      ? "transform 240ms cubic-bezier(0.2, 0.8, 0.2, 1)"
      : "none";
    el.style.transform = `translateX(${px}px)`;
  };

  const onDrawerTouchStart = (e) => {
    if (!drawerOpen) return;
    const el = drawerInnerRef.current;
    if (!el) return;

    const x = e.touches?.[0]?.clientX ?? 0;
    const tNow = performance.now();

    touchRef.current.dragging = true;
    touchRef.current.startX = x;
    touchRef.current.lastX = x;
    touchRef.current.dx = 0;
    touchRef.current.lastT = tNow;
    touchRef.current.velocity = 0;

    el.style.transition = "none";
  };

  const onDrawerTouchMove = (e) => {
    const el = drawerInnerRef.current;
    if (!el) return;
    if (!touchRef.current.dragging) return;

    const x = e.touches?.[0]?.clientX ?? 0;
    const tNow = performance.now();

    let dx = x - touchRef.current.startX; // left => negative
    if (dx > 0) dx = 0;

    const maxLeft = -drawerWidth;
    let translate = dx;
    if (translate < maxLeft) translate = rubberBandLeft(translate, maxLeft);
    if (translate > 0) translate = 0;

    const dt = Math.max(1, tNow - touchRef.current.lastT);
    const dX = x - touchRef.current.lastX;
    const v = dX / dt;

    touchRef.current.lastX = x;
    touchRef.current.lastT = tNow;
    touchRef.current.dx = dx;
    touchRef.current.velocity = v;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => setDrawerTranslate(translate, false));
  };

  const onDrawerTouchEnd = () => {
    const el = drawerInnerRef.current;
    if (!el) return;
    if (!touchRef.current.dragging) return;

    touchRef.current.dragging = false;

    const dx = touchRef.current.dx; // negative
    const velocity = touchRef.current.velocity; // negative when flick left

    const distanceThreshold = -90;
    const velocityThreshold = -0.6;

    const shouldClose = dx < distanceThreshold || velocity < velocityThreshold;

    if (shouldClose) {
      setDrawerTranslate(-drawerWidth, true);
      setTimeout(() => setDrawerOpen(false), 220);
    } else {
      setDrawerTranslate(0, true);
    }
  };

  useEffect(() => {
    if (!drawerOpen && drawerInnerRef.current) {
      drawerInnerRef.current.style.transition = "none";
      drawerInnerRef.current.style.transform = "translateX(0px)";
    }
  }, [drawerOpen]);

  // =========================
  // RENDER
  // =========================
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

        {/* Online/Offline chip */}
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
                onClick={() => navigate(s.path)}
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

                  {active && (
                    <Tag color="green" style={{ marginTop: 2, borderRadius: 999, fontWeight: 800, padding: "2px 10px" }}>
                      {t?.active || "Active"}
                    </Tag>
                  )}
                </div>
              </Card>
            );
          })}
        </Space>
      </div>

      {/* DRAWER */}
      <Drawer
        placement="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={drawerWidth}
        bodyStyle={{ padding: 0 }}
        maskClosable
      >
        <div
          ref={drawerInnerRef}
          style={{ height: "100%", background: "#fff", willChange: "transform", touchAction: "pan-y" }}
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
                    style={{ width: "100%", height: "100%", borderRadius: 12, objectFit: "cover", display: "block" }}
                  />
                ) : (
                  initials(profile.fullName)
                )}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 900 }}>{profile.fullName || "Haydovchi"}</div>
                <div style={{ opacity: 0.85, fontSize: 12 }}>{t?.driver || "Haydovchi"}</div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                <div style={{ fontSize: 11, opacity: 0.85, marginBottom: 4 }}>
                  {isOnline ? (t?.online || "Online") : (t?.offline || "Offline")}
                </div>
                <Switch size="small" checked={isOnline} onChange={toggleOnline} />
              </div>
            </div>
          </div>

          <div style={{ padding: 12, position: "relative", minHeight: "calc(100vh - 80px)" }}>
            <Button block icon={<SettingOutlined />} style={{ height: 44, borderRadius: 12, textAlign: "left" }} onClick={() => go("/settings")}>
              {t?.settings || "Sozlamalar"}
            </Button>

            <Button block icon={<HistoryOutlined />} style={{ height: 44, borderRadius: 12, textAlign: "left", marginTop: 8 }} onClick={() => go("/driver/orders")}>
              {t?.orderHistoryDriver || "Buyurtmalar tarixi"}
            </Button>

            <Divider style={{ margin: "12px 0" }} />

            <div style={{ position: "absolute", left: 12, right: 12, bottom: 12 }}>
              <Button block icon={<CustomerServiceOutlined />} style={{ height: 44, borderRadius: 12, textAlign: "left" }} onClick={() => go("/support")}>
                {t?.support || "Qo‘llab-quvvatlash"}
              </Button>

              <Button danger block icon={<LogoutOutlined />} style={{ height: 44, borderRadius: 12, textAlign: "left", marginTop: 8 }} onClick={() => go("/logout")}>
                {t?.logout || "Chiqish"}
              </Button>
            </div>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
