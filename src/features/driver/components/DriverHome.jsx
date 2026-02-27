import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { appConfig } from "../../../shared/config/appConfig";
import {
  Button,
  Card,
  Typography,
  Row,
  Col,
  Drawer,
  Switch,
  Tag,
  message,
  Spin
} from "antd";
import {
  ArrowLeftOutlined,
  MenuOutlined,
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
  StopOutlined,
  CheckCircleOutlined
} from "@ant-design/icons";

import DriverTaxi from "./services/DriverTaxi";
import DriverInterDistrict from "./services/DriverInterDistrict";
import DriverInterProvincial from "./services/DriverInterProvincial";
import DriverFreight from "./services/DriverFreight";
import DriverDelivery from "./services/DriverDelivery";

import DriverProfile from "./DriverProfile";
import DriverSidebar from "./DriverSidebar";

import { supabase } from "@lib/supabase"; 
import { startTracking } from "./services/locationService";

const { Title, Text } = Typography;

export default function DriverHome({ onLogout }) {
  const navigate = useNavigate();

  // =========================
  // STATE
  // =========================
  const [selectedService, setSelectedService] = useState(
    (typeof window !== "undefined" ? localStorage.getItem("driverActiveService") : null) || null
  );
  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // =========================
  // BACK (browser / Android back) handling
  // =========================
  // Bu loyihada servislar route bilan emas, ichki state bilan ochiladi.
  // Shuning uchun foydalanuvchi "Shahar ichi"ga kirganda browser back ishlamay qoladi.
  // Yechim: servis ochilganda history'ga bitta state push qilamiz.
  // Back bosilganda popstate keladi va menyuga qaytaramiz.
  useEffect(() => {
    const onPopState = () => {
      setSelectedService((prev) => {
        if (prev) {
          try {
            localStorage.removeItem("driverActiveService");
          } catch (e) {}
          return null;
        }
        return prev;
      });
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (!selectedService) return;
    try {
      window.history.pushState(
        { driverService: selectedService, ts: Date.now() },
        "",
        window.location.href
      );
    } catch (e) {
      // ignore
    }
  }, [selectedService]);

  // Online flag (persist)
  const [isOnline, setIsOnline] = useState(() => {
    const v = (typeof window !== "undefined" ? localStorage.getItem("driverOnline") : null);
    return v === "1";
  });

  const API_BASE = (import.meta?.env?.VITE_API_BASE || "").replace(/\/$/, "");

  // =========================
  // PRESS ANIMATION
  // =========================
  const btnTouchProps = {
    onMouseDown: (e) => (e.currentTarget.style.transform = "scale(0.97)"),
    onMouseUp: (e) => (e.currentTarget.style.transform = "scale(1)"),
    onMouseLeave: (e) => (e.currentTarget.style.transform = "scale(1)"),
    onTouchStart: (e) => (e.currentTarget.style.transform = "scale(0.97)"),
    onTouchEnd: (e) => (e.currentTarget.style.transform = "scale(1)"),
  };

  // =========================
  // ACTIVE BADGE (selectedService)
  // =========================
  const selectService = (key) => {
    setSelectedService(key);
    if (typeof window !== "undefined") localStorage.setItem("driverActiveService", key);
  };

  const backToMenu = () => {
    setSelectedService(null);
    if (typeof window !== "undefined") localStorage.removeItem("driverActiveService");
  };

  // =========================
  // HEARTBEAT + LOCATION (ONLINE)
  // =========================
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

  const sendDriverState = async (driver_id, nextOnline) => {
    const state = nextOnline ? "online" : "offline";
    try {
      if (API_BASE) {
         await postJson("/api/driver-state", { driver_id, state });
      }
    } catch {
      // ignore
    }
  };

  const sendHeartbeat = async (driver_id, nextOnline) => {
    const { lat, lng, bearing } = lastGeoRef.current || {};
    try {
      if (API_BASE) {
          await postJson("/api/driver-heartbeat", {
            driver_id,
            is_online: !!nextOnline,
            lat: lat ?? undefined,
            lng: lng ?? undefined,
            bearing: bearing ?? undefined,
          });
      }
    } catch {
      // ignore
    }
  };

  const stopTrackingFunc = () => {
    // stop geolocation watch
    if (watchIdRef.current !== null && watchIdRef.current !== undefined) {
      try {
        navigator.geolocation?.clearWatch?.(watchIdRef.current);
      } catch {
        // ignore
      }
    }
    watchIdRef.current = null;

    // stop heartbeat interval
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

  // ✅ TUZATILGAN TOGGLE FUNCTION
  const toggleOnline = async (next) => {
    setLoading(true);
    try {
      const { data: u, error: uErr } = await supabase.auth.getUser();
      if (uErr) throw uErr;
      const user = u?.user;
      
      if (!user) {
          setLoading(false);
          return;
      }

      userIdRef.current = user.id;

      // 1. Supabase Update (Faqat is_online ni o'zgartiramiz, statusga tegmaymiz!)
      const { error } = await supabase
          .from("drivers")
          .update({
            is_online: next,
            last_seen_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);

      if (error) throw error;

      // 2. State yangilash
      setIsOnline(next);
      if (typeof window !== "undefined") localStorage.setItem("driverOnline", next ? "1" : "0");
      
      // 3. Backendga xabar
      await sendDriverState(user.id, next);

      message.success(next ? "Siz Online rejimdasiz" : "Siz Offline rejimdasiz");
    } catch (err) {
      console.error("Status update error:", err);
      // Agar xato bo'lsa, UI ni eski holatga qaytarish mumkin, 
      // lekin hozircha xabarni o'zi yetarli.
      message.error("Statusni o'zgartirishda xatolik!");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (typeof onLogout === "function") {
        await onLogout();
      } else {
        await supabase?.auth?.signOut?.();
      }
    } catch {
      // ignore
    } finally {
      navigate("/login", { replace: true });
    }
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data: u, error: uErr } = await supabase.auth.getUser();
        if (uErr) throw uErr;

        const user = u?.user;
        if (!user) return;

        userIdRef.current = user.id;

        if (!isOnline) {
          await sendDriverState(user.id, false);
          stopTrackingFunc();
          return;
        }

        stopTrackingFunc();
        await startOnlineLoop(user.id);

        if (cancelled) stopTrackingFunc();
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
      stopTrackingFunc();
    };
  }, [isOnline]);

  // =========================
  // RIGHT DRAWER SWIPE CLOSE (rubber band + velocity)
  // =========================
  const drawerInnerRef = useRef(null);
  const rafRef = useRef(0);
  const drawerWidthPxRef = useRef(typeof window !== "undefined" ? window.innerWidth : 360);

  useEffect(() => {
    const onResize = () => {
      drawerWidthPxRef.current = typeof window !== "undefined" ? window.innerWidth : 360;
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const touchRef = useRef({
    dragging: false,
    startX: 0,
    lastX: 0,
    dx: 0,
    lastT: 0,
    velocity: 0,
  });

  const rubberBandRight = (dx, maxRight) => {
    if (dx <= maxRight) return dx;
    return maxRight + (dx - maxRight) * 0.35;
  };

  const setDrawerTranslate = (px, withTransition) => {
    const el = drawerInnerRef.current;
    if (!el) return;
    el.style.transition = withTransition
      ? "transform 240ms cubic-bezier(0.2, 0.8, 0.2, 1)"
      : "none";
    el.style.transform = `translateX(${px}px)`;
  };

  const onProfileTouchStart = (e) => {
    if (!profileOpen) return;
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

  const onProfileTouchMove = (e) => {
    const el = drawerInnerRef.current;
    if (!el) return;
    if (!touchRef.current.dragging) return;

    const x = e.touches?.[0]?.clientX ?? 0;
    const tNow = performance.now();

    let dx = x - touchRef.current.startX; // right to close => positive
    if (dx < 0) dx = 0;

    const maxRight = drawerWidthPxRef.current;
    let translate = dx;
    if (translate > maxRight) translate = rubberBandRight(translate, maxRight);

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

  const onProfileTouchEnd = () => {
    const el = drawerInnerRef.current;
    if (!el) return;
    if (!touchRef.current.dragging) return;

    touchRef.current.dragging = false;

    const dx = touchRef.current.dx;
    const velocity = touchRef.current.velocity;

    const distanceThreshold = 90;
    const velocityThreshold = 0.6;

    const shouldClose = dx > distanceThreshold || velocity > velocityThreshold;

    if (shouldClose) {
      setDrawerTranslate(drawerWidthPxRef.current, true);
      setTimeout(() => setProfileOpen(false), 220);
    } else {
      setDrawerTranslate(0, true);
    }
  };

  useEffect(() => {
    if (!profileOpen && drawerInnerRef.current) {
      drawerInnerRef.current.style.transition = "none";
      drawerInnerRef.current.style.transform = "translateX(0px)";
    }
  }, [profileOpen]);

  // =========================
  // CONTENT RENDER
  // =========================
  const content = useMemo(() => {
    if (selectedService === "taxi") return <DriverTaxi onBack={backToMenu} />;
    if (selectedService === "interDist") return <DriverInterDistrict onBack={backToMenu} />;
    if (selectedService === "interProv") return <DriverInterProvincial onBack={backToMenu} />;
    if (selectedService === "freight") return <DriverFreight onBack={backToMenu} />;
    if (selectedService === "delivery") return <DriverDelivery onBack={backToMenu} />;
    return null;
  }, [selectedService]);

  // =========================
  // MENU UI
  // =========================
  const menuUi = (
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
          onClick={() => setSidebarOpen(true)}
          icon={<MenuOutlined />}
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

        {/* ✅ Online/Offline chip headerda */}
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
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
              background: "var(--field-bg)",
              border: "1px solid var(--field-border)",
              boxShadow: "var(--shadow-soft)",
              cursor: "pointer",
              userSelect: "none",
              transition: "transform 0.1s",
              color: "var(--card-text)",
            }}
            {...btnTouchProps}
          >
            {loading ? <Spin size="small" /> : (
            <>
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
                {isOnline ? "Online" : "Offline"}
                </span>
            </>
            )}
          </div>

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

      {/* LEFT SIDEBAR */}
      <DriverSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
        onGoClient={() => {
          setSidebarOpen(false);
          navigate("/client/home", { replace: true });
        }}
        onGoOrders={() => {
          setSidebarOpen(false);
          navigate("/driver/orders");
        }}
        onGoWallet={() => {
          setSidebarOpen(false);
          navigate("/driver/wallet");
        }}
        onGoSettings={() => {
          setSidebarOpen(false);
          navigate("/driver/settings");
        }}
        onGoPromo={() => {
          setSidebarOpen(false);
          navigate("/driver/promo");
        }}
        onGoGuide={() => {
          setSidebarOpen(false);
          navigate("/driver/guide");
        }}
      />

      {/* ===================================
          ASOSIY MENYU QISMI (OVERLAY BILAN)
          ===================================
      */}
      <div style={{ position: "relative" }}>
        
        {/* 🔥 1. BLOKLASH QAVATI (OVERLAY) */}
        {!isOnline && (
          <div style={{
            position: "absolute",
            top: -10, left: -10, right: -10, bottom: -10,
            background: "rgba(245, 245, 245, 0.6)", // Orqa fonni xira qiladi
            zIndex: 50,
            backdropFilter: "blur(3px)", // Xiralashtirish effekti
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 12
          }}>
            <StopOutlined style={{ fontSize: 48, color: "#ff4d4f", marginBottom: 16 }} />
            <Title level={4} style={{ color: "#595959", textAlign: "center", margin: 0 }}>
              Xizmatlar bloklangan
            </Title>
            <Text type="secondary" style={{ marginBottom: 20 }}>
              Ishni boshlash uchun "Online" tugmasini yoqing
            </Text>
            <Button 
              type="primary" 
              size="large" 
              onClick={() => toggleOnline(true)}
              loading={loading}
              icon={<CheckCircleOutlined />}
              style={{ borderRadius: 12, height: 45, paddingLeft: 24, paddingRight: 24 }}
            >
              Online bo'lish
            </Button>
          </div>
        )}

        {/* 2. MENYU KARTOCHKALARI (Offline bo'lsa xira bo'ladi) */}
        <div style={{ 
            opacity: isOnline ? 1 : 0.4, 
            pointerEvents: isOnline ? "auto" : "none",
            transition: "opacity 0.3s ease" 
        }}>
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
                    border:
                        selectedService === "taxi"
                        ? "1px solid rgba(82,196,26,0.45)"
                        : "1px solid var(--card-border)",
                    background: "var(--card-bg)",
                    boxShadow:
                        selectedService === "taxi"
                        ? "0 12px 26px rgba(0,0,0,0.18)"
                        : "var(--shadow-soft)",
                    position: "relative",
                    overflow: "hidden",
                    }}
                    {...btnTouchProps}
                >
                    {selectedService === "taxi" && (
                    <div style={{ position: "absolute", top: 12, right: 12 }}>
                        <Tag color="green" style={{ borderRadius: 999, fontWeight: 800, padding: "2px 10px" }}>
                        Active
                        </Tag>
                    </div>
                    )}

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
                    border:
                        selectedService === "interProv"
                        ? "1px solid rgba(82,196,26,0.45)"
                        : "1px solid var(--card-border)",
                    background: "var(--card-bg)",
                    boxShadow:
                        selectedService === "interProv"
                        ? "0 12px 26px rgba(0,0,0,0.18)"
                        : "var(--shadow-soft)",
                    position: "relative",
                    overflow: "hidden",
                    }}
                    {...btnTouchProps}
                >
                    {selectedService === "interProv" && (
                    <div style={{ position: "absolute", top: 10, right: 10 }}>
                        <Tag color="green" style={{ borderRadius: 999, fontWeight: 800, padding: "2px 10px" }}>
                        Active
                        </Tag>
                    </div>
                    )}
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
                    border:
                        selectedService === "interDist"
                        ? "1px solid rgba(82,196,26,0.45)"
                        : "1px solid var(--card-border)",
                    background: "var(--card-bg)",
                    boxShadow:
                        selectedService === "interDist"
                        ? "0 12px 26px rgba(0,0,0,0.18)"
                        : "var(--shadow-soft)",
                    position: "relative",
                    overflow: "hidden",
                    }}
                    {...btnTouchProps}
                >
                    {selectedService === "interDist" && (
                    <div style={{ position: "absolute", top: 10, right: 10 }}>
                        <Tag color="green" style={{ borderRadius: 999, fontWeight: 800, padding: "2px 10px" }}>
                        Active
                        </Tag>
                    </div>
                    )}
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
                    border:
                        selectedService === "freight"
                        ? "1px solid rgba(82,196,26,0.45)"
                        : "1px solid var(--card-border)",
                    background: "var(--card-bg)",
                    boxShadow:
                        selectedService === "freight"
                        ? "0 12px 26px rgba(0,0,0,0.18)"
                        : "var(--shadow-soft)",
                    position: "relative",
                    overflow: "hidden",
                    }}
                    {...btnTouchProps}
                >
                    {selectedService === "freight" && (
                    <div style={{ position: "absolute", top: 10, right: 10 }}>
                        <Tag color="green" style={{ borderRadius: 999, fontWeight: 800, padding: "2px 10px" }}>
                        Active
                        </Tag>
                    </div>
                    )}
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
                    border:
                        selectedService === "delivery"
                        ? "1px solid rgba(82,196,26,0.45)"
                        : "1px solid var(--card-border)",
                    background: "var(--card-bg)",
                    boxShadow:
                        selectedService === "delivery"
                        ? "0 12px 26px rgba(0,0,0,0.18)"
                        : "var(--shadow-soft)",
                    position: "relative",
                    overflow: "hidden",
                    }}
                    {...btnTouchProps}
                >
                    {selectedService === "delivery" && (
                    <div style={{ position: "absolute", top: 10, right: 10 }}>
                        <Tag color="green" style={{ borderRadius: 999, fontWeight: 800, padding: "2px 10px" }}>
                        Active
                        </Tag>
                    </div>
                    )}
                    <RocketOutlined style={{ fontSize: 30, color: "#eb2f96", marginBottom: 15 }} />
                    <div style={{ fontWeight: "bold", fontSize: 15 }}>Eltish xizmati</div>
                </Card>
                </Col>
            </Row>

            {/* SUPER PRO */}
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
                        <Button block icon={<ToolOutlined />} onClick={() => navigate("/garage")} style={{ transition: "transform 0.1s" }} {...btnTouchProps}>
                        Garage
                        </Button>
                    </Col>
                    )}
                    {appConfig.features.payments && (
                    <Col span={8}>
                        <Button block icon={<WalletOutlined />} onClick={() => navigate("/payments")} style={{ transition: "transform 0.1s" }} {...btnTouchProps}>
                        To‘lov
                        </Button>
                    </Col>
                    )}
                    {appConfig.features.searchOnRoute && (
                    <Col span={8}>
                        <Button block icon={<SearchOutlined />} onClick={() => navigate("/search-route")} style={{ transition: "transform 0.1s" }} {...btnTouchProps}>
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
        </div>
      </div>


      {/* PROFIL DRAWER (RIGHT) */}
      <Drawer
        placement="right"
        width="100%"
        closable={false}
        onClose={() => setProfileOpen(false)}
        open={profileOpen}
        styles={{ body: { padding: 0 } }}
        maskClosable
      >
        <div
          ref={drawerInnerRef}
          style={{ height: "100%", background: "#fff", willChange: "transform", touchAction: "pan-y" }}
          onTouchStart={onProfileTouchStart}
          onTouchMove={onProfileTouchMove}
          onTouchEnd={onProfileTouchEnd}
        >
          <div
            style={{
              padding: 12,
              background: "#111",
              color: "white",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div style={{ fontWeight: 900 }}>Profil</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ fontSize: 12, opacity: 0.9 }}>{isOnline ? "Online" : "Offline"}</div>
              <Switch size="small" checked={isOnline} onChange={toggleOnline} loading={loading} />
            </div>
          </div>

          <DriverProfile
            onBack={() => setProfileOpen(false)}
            onLogout={() => {
              setProfileOpen(false);
              onLogout?.();
            }}
          />
        </div>
      </Drawer>
    </div>
  );

  return <div style={{ minHeight: "100vh" }}>{content ? content : menuUi}</div>;
}