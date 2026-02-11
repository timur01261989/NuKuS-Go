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
} from "antd";
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

// ✅ Supabase + GPS tracking
import { supabase } from "@lib/supabase";
import { startTracking } from "./services/locationService";

const { Title, Text } = Typography;

export default function DriverHome({ onLogout }) {
  const navigate = useNavigate();

  // Holatni saqlash
  const [selectedService, setSelectedService] = useState(
    localStorage.getItem("driverActiveService") || null
  );
  const [profileOpen, setProfileOpen] = useState(false);

  // ✅ Online / Offline indikator
  const [isOnline, setIsOnline] = useState(() => {
    const v = localStorage.getItem("driverOnline");
    return v === "1";
  });

  // ✅ API base (bo‘lmasa "/api/..." ishlaydi)
  const API_BASE = (import.meta?.env?.VITE_API_BASE || "").replace(/\/$/, "");

  // ✅ Heartbeat/location state
  const lastGeoRef = useRef({ lat: null, lng: null, bearing: null, speed: null });
  const watchIdRef = useRef(null);
  const heartbeatTimerRef = useRef(null);
  const userIdRef = useRef(null);

  // =========================
  // ✅ ACTIVE BADGE (tanlangan cardda)
  // =========================
  const selectService = (key) => {
    setSelectedService(key);
    localStorage.setItem("driverActiveService", key);
  };

  const backToMenu = () => {
    setSelectedService(null);
    localStorage.removeItem("driverActiveService");
  };

  // =========================
  // ✅ TOUCH press animatsiya
  // =========================
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

  // =========================
  // ✅ ONLINE => realtime heartbeat + location
  // =========================
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

  const toggleOnline = async (next) => {
    setIsOnline(next);
    localStorage.setItem("driverOnline", next ? "1" : "0");

    try {
      const { data: u, error: uErr } = await supabase.auth.getUser();
      if (uErr) throw uErr;
      const user = u?.user;
      if (!user) return;

      userIdRef.current = user.id;

      // ixtiyoriy: drivers jadvaliga yozib ko‘ramiz (ustun bo‘lmasa ham UI buzilmaydi)
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

      // serverless state endpoint
      await sendDriverState(user.id, next);

      message.success(next ? "Online" : "Offline");
    } catch {
      // ignore
    }
  };

  // Online bo‘lsa: GPS watch + heartbeat interval; Offline bo‘lsa: stop
  useEffect(() => {
    let cancelled = false;

    const cleanup = () => {
      if (watchIdRef.current !== null && watchIdRef.current !== undefined) {
        try {
          navigator.geolocation?.clearWatch?.(watchIdRef.current);
        } catch {
          // ignore
        }
        watchIdRef.current = null;
      }
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = null;
      }
    };

    (async () => {
      try {
        const { data: u, error: uErr } = await supabase.auth.getUser();
        if (uErr) throw uErr;
        const user = u?.user;
        if (!user) return;

        userIdRef.current = user.id;

        // state yuboramiz
        await sendDriverState(user.id, isOnline);

        if (!isOnline) {
          cleanup();
          return;
        }

        // GPS tracking
        const watchId = startTracking((pos) => {
          if (cancelled) return;
          lastGeoRef.current = {
            lat: pos?.lat ?? null,
            lng: pos?.lng ?? null,
            bearing: pos?.heading ?? null,
            speed: pos?.speed ?? null,
          };
        });

        watchIdRef.current = watchId ?? null;

        // darhol heartbeat
        await sendHeartbeat(user.id, true);

        // interval heartbeat (15s)
        heartbeatTimerRef.current = setInterval(() => {
          if (cancelled) return;
          const uid = userIdRef.current;
          if (!uid) return;
          sendHeartbeat(uid, true);
        }, 15000);
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [isOnline]);

  // =========================
  // ✅ PROFIL DRAWER: swipe-close (RIGHT drawer) rubber band + velocity
  // =========================
  const drawerWidthPx = useMemo(() => {
    // width="100%" bo‘lgani uchun real px qiymat: window.innerWidth
    return typeof window !== "undefined" ? window.innerWidth : 360;
  }, []);

  const drawerInnerRef = useRef(null);
  const rafRef = useRef(0);
  const touchRef = useRef({
    dragging: false,
    startX: 0,
    lastX: 0,
    dx: 0,
    lastT: 0,
    velocity: 0, // px/ms
  });

  // RIGHT drawer: yopish tomoni o‘ngga (dx > 0)
  const rubberBandRight = (dx, maxRight) => {
    // dx: positive, maxRight: drawerWidth
    if (dx <= maxRight) return dx;
    const over = dx - maxRight; // positive
    const damped = over * 0.35;
    return maxRight + damped;
  };

  const setDrawerTranslate = (px, withTransition = false) => {
    if (!drawerInnerRef.current) return;
    const el = drawerInnerRef.current;
    el.style.transition = withTransition
      ? "transform 240ms cubic-bezier(0.2, 0.8, 0.2, 1)"
      : "none";
    el.style.transform = `translateX(${px}px)`;
  };

  const onProfileTouchStart = (e) => {
    if (!drawerInnerRef.current) return;
    if (!profileOpen) return;

    const x = e.touches?.[0]?.clientX ?? 0;
    const tNow = performance.now();

    touchRef.current.dragging = true;
    touchRef.current.startX = x;
    touchRef.current.lastX = x;
    touchRef.current.dx = 0;
    touchRef.current.lastT = tNow;
    touchRef.current.velocity = 0;

    drawerInnerRef.current.style.transition = "none";
  };

  const onProfileTouchMove = (e) => {
    if (!drawerInnerRef.current) return;
    if (!touchRef.current.dragging) return;

    const x = e.touches?.[0]?.clientX ?? 0;
    const tNow = performance.now();

    // RIGHT drawer: o‘ngga tortsa dx positive (yopish)
    let dx = x - touchRef.current.startX;

    // Chapga tortishni bloklaymiz (ochiq drawerni chapga surmaymiz)
    if (dx < 0) dx = 0;

    const maxRight = drawerWidthPx;
    let translate = dx;

    // overdrag bo‘lsa rubber band
    if (translate > maxRight) translate = rubberBandRight(translate, maxRight);

    // velocity
    const dt = Math.max(1, tNow - touchRef.current.lastT);
    const dX = x - touchRef.current.lastX;
    const v = dX / dt;

    touchRef.current.lastX = x;
    touchRef.current.lastT = tNow;
    touchRef.current.dx = dx;
    touchRef.current.velocity = v;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setDrawerTranslate(translate, false);
    });
  };

  const onProfileTouchEnd = () => {
    if (!drawerInnerRef.current) return;
    if (!touchRef.current.dragging) return;

    touchRef.current.dragging = false;

    const dx = touchRef.current.dx; // positive
    const velocity = touchRef.current.velocity; // o‘ngga tez bo‘lsa positive

    const distanceThreshold = 90; // px
    const velocityThreshold = 0.6; // px/ms

    const shouldClose = dx > distanceThreshold || velocity > velocityThreshold;

    if (shouldClose) {
      setDrawerTranslate(drawerWidthPx, true);
      setTimeout(() => {
        setProfileOpen(false);
      }, 220);
    } else {
      setDrawerTranslate(0, true);
    }
  };

  // Drawer yopilganda reset
  useEffect(() => {
    if (!profileOpen && drawerInnerRef.current) {
      drawerInnerRef.current.style.transition = "none";
      drawerInnerRef.current.style.transform = "translateX(0px)";
    }
  }, [profileOpen]);

  // =========================
  // ✅ CONTENT: menu yoki service
  // =========================
  const content = useMemo(() => {
    if (selectedService === "taxi") return <DriverTaxi onBack={backToMenu} />;
    if (selectedService === "interDist") return <DriverInterDistrict onBack={backToMenu} />;
    if (selectedService === "interProv") return <DriverInterProvincial onBack={backToMenu} />;
    if (selectedService === "freight") return <DriverFreight onBack={backToMenu} />;
    if (selectedService === "delivery") return <DriverDelivery onBack={backToMenu} />;
    return null;
  }, [selectedService]);

  // --- ASOSIY MENYU UI ---
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
          <Title
            level={5}
            style={{ margin: 0, fontWeight: 800, color: "var(--text)" }}
          >
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
          </div>

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
            {/* ✅ Active badge */}
            {selectedService === "taxi" && (
              <div style={{ position: "absolute", top: 12, right: 12 }}>
                <Tag
                  color="green"
                  style={{
                    borderRadius: 999,
                    fontWeight: 800,
                    padding: "2px 10px",
                  }}
                >
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
                <Tag
                  color="green"
                  style={{
                    borderRadius: 999,
                    fontWeight: 800,
                    padding: "2px 10px",
                  }}
                >
                  Active
                </Tag>
              </div>
            )}

            <GlobalOutlined
              style={{ fontSize: 30, color: "#1890ff", marginBottom: 15 }}
            />
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
                <Tag
                  color="green"
                  style={{
                    borderRadius: 999,
                    fontWeight: 800,
                    padding: "2px 10px",
                  }}
                >
                  Active
                </Tag>
              </div>
            )}

            <EnvironmentOutlined
              style={{ fontSize: 30, color: "#52c41a", marginBottom: 15 }}
            />
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
                <Tag
                  color="green"
                  style={{
                    borderRadius: 999,
                    fontWeight: 800,
                    padding: "2px 10px",
                  }}
                >
                  Active
                </Tag>
              </div>
            )}

            <ShopOutlined
              style={{ fontSize: 30, color: "#faad14", marginBottom: 15 }}
            />
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
                <Tag
                  color="green"
                  style={{
                    borderRadius: 999,
                    fontWeight: 800,
                    padding: "2px 10px",
                  }}
                >
                  Active
                </Tag>
              </div>
            )}

            <RocketOutlined
              style={{ fontSize: 30, color: "#eb2f96", marginBottom: 15 }}
            />
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
        maskClosable
      >
        {/* ✅ Swipe-close wrapper (RIGHT drawer) */}
        <div
          ref={drawerInnerRef}
          style={{
            height: "100%",
            background: "#fff",
            willChange: "transform",
            touchAction: "pan-y",
          }}
          onTouchStart={onProfileTouchStart}
          onTouchMove={onProfileTouchMove}
          onTouchEnd={onProfileTouchEnd}
        >
          {/* Drawer ichida ham Online switch (ixtiyoriy, lekin qulay) */}
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
              <div style={{ fontSize: 12, opacity: 0.9 }}>
                {isOnline ? "Online" : "Offline"}
              </div>
              <Switch size="small" checked={isOnline} onChange={toggleOnline} />
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

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Agar service tanlangan bo‘lsa uni ko‘rsatamiz (DriverHome unmount bo‘lmaydi) */}
      {content ? content : menuUi}
    </div>
  );
}
