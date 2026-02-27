import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Drawer, Switch, message } from "antd";

import { appConfig } from "../../../shared/config/appConfig";

import DriverTaxi from "./services/DriverTaxi";
import DriverInterDistrict from "./services/DriverInterDistrict";
import DriverInterProvincial from "./services/DriverInterProvincial";
import DriverFreight from "./services/DriverFreight";
import DriverDelivery from "./services/DriverDelivery";

import DriverProfile from "./DriverProfile";

import { supabase } from "@lib/supabase";
import { startTracking } from "./services/locationService";

function safeShortId(id) {
  const s = String(id || "");
  if (!s) return "----";
  return s.length > 6 ? s.slice(-6) : s;
}

export default function DriverHome({ onLogout }) {
  const navigate = useNavigate();

  // =========================
  // STATE
  // =========================
  const [selectedService, setSelectedService] = useState(
    (typeof window !== "undefined" ? localStorage.getItem("driverActiveService") : null) || null
  );
  const [profileOpen, setProfileOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Driver header info (name/avatar/id)
  const [driverHeader, setDriverHeader] = useState({
    name: "Haydovchi",
    publicId: "----",
    avatarUrl: "",
  });

  // =========================
  // BACK (browser / Android back) handling
  // =========================
  useEffect(() => {
    const onPopState = () => {
      setSelectedService((prev) => {
        if (prev) {
          try {
            localStorage.removeItem("driverActiveService");
          } catch {
            // ignore
          }
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
    } catch {
      // ignore
    }
  }, [selectedService]);

  const selectService = (key) => {
    setSelectedService(key);
    if (typeof window !== "undefined") localStorage.setItem("driverActiveService", key);
  };

  const backToMenu = () => {
    setSelectedService(null);
    if (typeof window !== "undefined") localStorage.removeItem("driverActiveService");
  };

  // =========================
  // Online flag (persist)
  // =========================
  const [isOnline, setIsOnline] = useState(() => {
    const v = typeof window !== "undefined" ? localStorage.getItem("driverOnline") : null;
    return v === "1";
  });

  const API_BASE = (import.meta?.env?.VITE_API_BASE || "").replace(/\/$/, "");

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

  // ✅ Toggle online/offline (existing principle preserved)
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

      // 1) Supabase update
      const { error } = await supabase
        .from("drivers")
        .update({
          is_online: next,
          last_seen_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) throw error;

      // 2) local state
      setIsOnline(next);
      if (typeof window !== "undefined") localStorage.setItem("driverOnline", next ? "1" : "0");

      // 3) backend notify
      await sendDriverState(user.id, next);

      message.success(next ? "Siz Online rejimdasiz" : "Siz Offline rejimdasiz");
    } catch (err) {
      console.error("Status update error:", err);
      message.error("Statusni o'zgartirishda xatolik!");
    } finally {
      setLoading(false);
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
  // HEADER DATA
  // =========================
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const { data: u, error: uErr } = await supabase.auth.getUser();
        if (uErr) throw uErr;
        const user = u?.user;
        if (!user || !alive) return;

        const { data: d } = await supabase
          .from("drivers")
          .select("id, first_name, avatar_url")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!alive) return;

        setDriverHeader({
          name: d?.first_name || "Haydovchi",
          publicId: d?.id ? String(d.id) : safeShortId(user.id),
          avatarUrl: d?.avatar_url || "",
        });
      } catch {
        // ignore
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

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
  // MENU UI (Tailwind design)
  // =========================
  const menuUi = (
    <div className="min-h-screen bg-backgroundLightDriver font-display text-slate-900">
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-transparent">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            className="p-2 rounded-xl neumorphic-pop text-slate-700"
            aria-label="Menu"
          >
            <span className="material-symbols-outlined block">menu</span>
          </button>
          <h1 className="text-2xl font-bold tracking-tight text-primarySidebar">Nukus Go</h1>
        </div>

        <button
          type="button"
          onClick={() => setProfileOpen(true)}
          className="flex items-center gap-3"
          aria-label="Profil"
        >
          <div className="text-right">
            <p className="text-sm font-bold leading-tight">{driverHeader.name}</p>
            <p className="text-xs text-slate-500">ID: {driverHeader.publicId}</p>
          </div>
          <div className="w-12 h-12 rounded-full neumorphic-pop p-1">
            {driverHeader.avatarUrl ? (
              <img
                alt="Driver"
                className="w-full h-full rounded-full object-cover"
                src={driverHeader.avatarUrl}
              />
            ) : (
              <div className="w-full h-full rounded-full flex items-center justify-center text-slate-600">
                <span className="material-symbols-outlined">person</span>
              </div>
            )}
          </div>
        </button>
      </header>

      {/* Status toggle */}
      <div className="px-4 py-2">
        <div className="neumorphic-pop rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isOnline ? "bg-green-500" : "bg-slate-400"}`} />
            <div>
              <p className="font-bold text-slate-800">Haydovchi holati</p>
              <p className="text-sm text-slate-500">
                {isOnline ? "Siz hozir onlayn rejimdasiz" : "Siz hozir oflayn rejimdasiz"}
              </p>
            </div>
          </div>

          <label
            className={`relative flex h-8 w-14 items-center rounded-full p-1 transition-colors ${
              isOnline ? "bg-primarySidebar" : "bg-slate-200"
            } ${loading ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <input
              className="sr-only"
              type="checkbox"
              checked={isOnline}
              onChange={(e) => {
                if (loading) return;
                toggleOnline(e.target.checked);
              }}
            />
            <div
              className={`h-6 w-6 rounded-full bg-white shadow-md transform transition-transform ${
                isOnline ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </label>
        </div>
      </div>

      {/* Main */}
      <main className="p-4 space-y-6 pb-24">
        {/* Primary: City taxi */}
        <section>
          <div
            role="button"
            tabIndex={0}
            onClick={() => selectService("taxi")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") selectService("taxi");
            }}
            className="neumorphic-pop rounded-2xl p-6 flex items-center justify-between border-2 border-primarySidebar/20 cursor-pointer"
          >
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center text-primarySidebar">
                <span className="material-symbols-outlined text-4xl">local_taxi</span>
              </div>
              <div className="text-left">
                <h3 className="text-2xl font-bold text-slate-900">Shahar ichida taksi</h3>
                <p className="text-slate-500 text-sm">Eng tezkor va qulay narxlar</p>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                selectService("taxi");
              }}
              className="bg-primarySidebar text-white h-12 w-12 rounded-xl flex items-center justify-center shadow-lg shadow-primarySidebar/30"
              aria-label="Kirish"
            >
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        </section>

        {/* Grid services */}
        <section className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => selectService("interProv")}
            className="neumorphic-pop rounded-2xl p-6 flex flex-col items-center text-center gap-4 border border-white/50"
          >
            <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center text-primarySidebar">
              <span className="material-symbols-outlined text-4xl">map</span>
            </div>
            <p className="font-bold text-slate-800">Viloyatlar aro</p>
          </button>

          <button
            type="button"
            onClick={() => selectService("interDist")}
            className="neumorphic-pop rounded-2xl p-6 flex flex-col items-center text-center gap-4 border border-white/50"
          >
            <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600">
              <span className="material-symbols-outlined text-4xl">distance</span>
            </div>
            <p className="font-bold text-slate-800">Tumanlar aro</p>
          </button>

          <button
            type="button"
            onClick={() => selectService("freight")}
            className="neumorphic-pop rounded-2xl p-6 flex flex-col items-center text-center gap-4 border border-white/50"
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
              <span className="material-symbols-outlined text-4xl">local_shipping</span>
            </div>
            <p className="font-bold text-slate-800">Yuk tashish</p>
          </button>

          <button
            type="button"
            onClick={() => selectService("delivery")}
            className="neumorphic-pop rounded-2xl p-6 flex flex-col items-center text-center gap-4 border border-white/50"
          >
            <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600">
              <span className="material-symbols-outlined text-4xl">inventory_2</span>
            </div>
            <p className="font-bold text-slate-800">Eltish xizmati</p>
          </button>
        </section>

        {/* Super Pro shortcuts (kept) */}
        {(appConfig.features.garage || appConfig.features.payments || appConfig.features.searchOnRoute) && (
          <section className="neumorphic-pop rounded-2xl p-4">
            <div className="font-bold text-slate-900 mb-3">Super Pro</div>
            <div className="grid grid-cols-3 gap-3">
              {appConfig.features.garage && (
                <button
                  type="button"
                  onClick={() => navigate("/garage")}
                  className="neumorphic-inset rounded-xl py-3 text-xs font-bold"
                >
                  Garage
                </button>
              )}
              {appConfig.features.payments && (
                <button
                  type="button"
                  onClick={() => navigate("/payments")}
                  className="neumorphic-inset rounded-xl py-3 text-xs font-bold"
                >
                  To‘lov
                </button>
              )}
              {appConfig.features.searchOnRoute && (
                <button
                  type="button"
                  onClick={() => navigate("/search-route")}
                  className="neumorphic-inset rounded-xl py-3 text-xs font-bold"
                >
                  Yo‘lda
                </button>
              )}
            </div>
            <div className="text-xs text-slate-500 mt-3">
              Eslatma: bu bo‘limlar scaffold. Keyin backend va POI manba bilan ulaysiz.
            </div>
          </section>
        )}
      </main>

      {/* Bottom nav (NO big + button) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-200 px-6 py-2 flex justify-between items-center z-50">
        <button
          type="button"
          className="flex flex-col items-center gap-1 text-primarySidebar"
          onClick={() => navigate("/driver/dashboard")}
        >
          <span className="material-symbols-outlined">home</span>
          <span className="text-[10px] font-bold">Asosiy</span>
        </button>
        <button
          type="button"
          className="flex flex-col items-center gap-1 text-slate-400"
          onClick={() => navigate("/driver/orders")}
        >
          <span className="material-symbols-outlined">history</span>
          <span className="text-[10px] font-medium">Buyurtmalar</span>
        </button>
        <button
          type="button"
          className="flex flex-col items-center gap-1 text-slate-400"
          onClick={() => navigate("/driver/wallet")}
        >
          <span className="material-symbols-outlined">account_balance_wallet</span>
          <span className="text-[10px] font-medium">Hamyon</span>
        </button>
        <button
          type="button"
          className="flex flex-col items-center gap-1 text-slate-400"
          onClick={() => navigate("/driver/profile")}
        >
          <span className="material-symbols-outlined">person</span>
          <span className="text-[10px] font-medium">Profil</span>
        </button>
      </nav>

      {/* Profile drawer (right) - existing flow kept */}
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
