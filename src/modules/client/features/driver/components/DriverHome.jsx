import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Drawer, message, Switch } from "antd";

import { appConfig } from "../../../shared/config/appConfig";

import DriverTaxi from "./services/DriverTaxi";
import DriverInterDistrict from "./services/DriverInterDistrict";
import DriverInterProvincial from "./services/DriverInterProvincial";
import DriverFreight from "./services/DriverFreight";
import DriverDelivery from "./services/DriverDelivery";

import DriverProfile from "./DriverProfile";
import DriverSidebar from "./DriverSidebar";

import { supabase } from "../../../lib/supabase";
import { fetchDriverCore } from "@/shared/auth/driverCoreAccess";
import { useDriverOnline } from "../core/useDriverOnline";
import { canActivateService } from "../core/serviceGuards";
import { useSpeedometer } from "../speed/useSpeedometer";
import { useRadar } from "../radar/useRadar";
import RadarMiniOverlay from "./RadarMiniOverlay";
import { useLanguage } from "@/shared/i18n/useLanguage";

function safeShortId(id) {
  const s = String(id || "");
  if (!s) return "----";
  return s.length > 6 ? s.slice(-6) : s;
}

function getServiceLabel(key) {
  return ({
    taxi: "Shahar taksi",
    interProv: "Viloyatlar aro",
    interDist: "Tumanlar aro",
    delivery: "Eltish",
    freight: "Yuk tashish",
  }[key] || key || "");
}

function getPreferredServiceKey(serviceTypes) {
  const checks = [
    ["taxi", serviceTypes?.city?.passenger || serviceTypes?.city?.delivery || serviceTypes?.city?.freight],
    ["interProv", serviceTypes?.intercity?.passenger || serviceTypes?.intercity?.delivery || serviceTypes?.intercity?.freight],
    ["interDist", serviceTypes?.interdistrict?.passenger || serviceTypes?.interdistrict?.delivery || serviceTypes?.interdistrict?.freight],
    ["delivery", serviceTypes?.city?.delivery || serviceTypes?.intercity?.delivery || serviceTypes?.interdistrict?.delivery],
    ["freight", serviceTypes?.city?.freight || serviceTypes?.intercity?.freight || serviceTypes?.interdistrict?.freight],
  ];
  const found = checks.find((item) => item[1]);
  return found?.[0] || null;
}

class DriverServiceErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error?.message || "Service crash" };
  }

  componentDidCatch(error) {
    console.error("Driver service render error:", error);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false, errorMessage: "" });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-backgroundLightDriver p-4">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            <div className="text-lg font-bold">Xizmat sahifasida xato</div>
            <div className="mt-2 text-sm">{this.state.errorMessage || "Noma'lum xato"}</div>
            <button
              type="button"
              onClick={this.props.onBack}
              className="mt-4 rounded-xl bg-primarySidebar px-4 py-2 font-semibold text-white"
            >
              Orqaga qaytish
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function DriverHome({ onLogout }) {
  const navigate = useNavigate();
  const { t, tr } = useLanguage();
  const {
    isOnline,
    activeService,
    activeVehicle,
    serviceTypes,
    canUseService,
    refreshCapabilities,
    setOnline,
    setOffline,
  } = useDriverOnline();

  // =========================
  // STATE
  // =========================
  const [selectedService, setSelectedService] = useState(
    (typeof window !== "undefined" ? localStorage.getItem("driver_active_service") : null) || null
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Driver header info (name/avatar/id)
  const [driverHeader, setDriverHeader] = useState({
    name: t.driverTitle,
    publicId: "----",
    avatarUrl: "",
  });

  useEffect(() => {
    refreshCapabilities?.();
  }, [refreshCapabilities]);

  const driveAssistantEnabled = Boolean(isOnline && (activeService || selectedService));
  const { speedKmh, position, heading } = useSpeedometer({ enabled: driveAssistantEnabled });
  const { nearestRadar, radarSeverity } = useRadar({
    enabled: driveAssistantEnabled,
    position,
    heading,
    speedKmh,
  });

  // =========================
  // BACK (browser / Android back) handling
  // =========================
  useEffect(() => {
    const onPopState = () => {
      setSelectedService((prev) => {
        if (prev) {
          try {
            localStorage.removeItem("driver_active_service");
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

  const backToMenu = useCallback(() => {
    setSelectedService(null);
    if (typeof window !== "undefined") localStorage.removeItem("driver_active_service");
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

  const selectService = useCallback((key) => {
    if (!canUseService?.(key)) {
      message.warning(tr("serviceDisabled", "Bu xizmat sizning sozlamalaringizda yoqilmagan"));
      return;
    }
    setSelectedService(key);
    if (typeof window !== "undefined") localStorage.setItem("driver_active_service", key);
  }, [canUseService, tr]);

  const toggleOnline = useCallback(async (checked) => {
    const nextOnline = typeof checked === "boolean" ? checked : !isOnline;
    setLoading(true);
    try {
      if (nextOnline) {
        const serviceToUse = selectedService || activeService || getPreferredServiceKey(serviceTypes);
        if (!serviceToUse) {
          message.warning("Sozlamalarda kamida bitta xizmatni yoqing");
          return;
        }
        if (!canUseService?.(serviceToUse)) {
          message.warning(tr("serviceDisabled", "Bu xizmat sizning sozlamalaringizda yoqilmagan"));
          return;
        }
        if (!activeVehicle?.id) {
          message.warning("Aktiv mashina tanlanmagan");
          return;
        }
        await setOnline(serviceToUse);
        message.success(tr("online", "Onlayn"));
      } else {
        await setOffline();
        message.success(tr("offline", "Oflayn"));
      }
    } catch (error) {
      console.error("DriverHome toggleOnline error:", error);
      message.error("Statusni o‘zgartirishda xatolik!");
    } finally {
      setLoading(false);
    }
  }, [isOnline, selectedService, activeService, serviceTypes, canUseService, activeVehicle?.id, setOnline, setOffline, tr]);

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

        const core = await fetchDriverCore(user.id);

        if (!alive) return;

        const fullName = core?.profile?.full_name || [core?.application?.first_name, core?.application?.last_name].filter(Boolean).join(" ");
        setDriverHeader({
          name: fullName || tr("driverTitle", "Haydovchi"),
          publicId: core?.activeVehicle?.id ? safeShortId(core.activeVehicle.id) : safeShortId(user.id),
          avatarUrl: core?.profile?.avatar_url || "",
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
  const visibleServices = useMemo(
    () => ({
      taxi: canUseService?.("taxi"),
      interProv: canUseService?.("interProv"),
      interDist: canUseService?.("interDist"),
      freight: canUseService?.("freight"),
      delivery: canUseService?.("delivery"),
    }),
    [canUseService]
  );

  const content = useMemo(() => {
    if (selectedService === "taxi") return <DriverTaxi onBack={backToMenu} />;
    if (selectedService === "interDist") return <DriverInterDistrict onBack={backToMenu} />;
    if (selectedService === "interProv") return <DriverInterProvincial onBack={backToMenu} />;
    if (selectedService === "freight") return <DriverFreight onBack={backToMenu} />;
    if (selectedService === "delivery") return <DriverDelivery onBack={backToMenu} />;
    return null;
  }, [selectedService, backToMenu]);

  const serviceContent = useMemo(() => {
    if (!content) return null;
    return (
      <DriverServiceErrorBoundary resetKey={selectedService} onBack={backToMenu}>
        {content}
      </DriverServiceErrorBoundary>
    );
  }, [content, selectedService, backToMenu]);

  const menuUi = (
    <div className="min-h-screen bg-backgroundLightDriver font-display text-slate-900">
      <DriverSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={onLogout} />

      <header className="flex items-center justify-between p-4 bg-transparent">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl neumorphic-pop text-slate-700"
            aria-label={t.menu || "Menyu"}
          >
            <span className="material-symbols-outlined block">menu</span>
          </button>

          <h1 className="text-2xl font-bold tracking-tight text-primarySidebar">{tr("appName", "UniGo")}</h1>
        </div>

        <button
          type="button"
          onClick={() => setProfileOpen(true)}
          className="flex items-center gap-3"
          aria-label="Profil"
        >
          <div className="text-right">
            <p className="text-sm font-bold leading-tight">{driverHeader?.name || tr("driverTitle", "Haydovchi")}</p>
            <p className="text-xs text-slate-500">ID: {driverHeader?.publicId || "----"}</p>
          </div>

          <div className="w-12 h-12 rounded-full neumorphic-pop p-1">
            {driverHeader?.avatarUrl ? (
              <img alt="Driver Profile" className="w-full h-full rounded-full object-cover" src={driverHeader.avatarUrl} />
            ) : (
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-primarySidebar">
                <span className="material-symbols-outlined" data-no-auto-translate="true">person</span>
              </div>
            )}
          </div>
        </button>
      </header>

      <div className="px-4 py-2">
        <div className="neumorphic-pop rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isOnline ? "bg-green-500" : "bg-slate-400"}`} />
            <div>
              <p className="font-bold text-slate-800">{tr("driverStatus", "Haydovchi holati")}</p>
              <p className="text-sm text-slate-500">
                {tr("currentStatus", "Siz hozir")} {isOnline ? `${tr("online", "onlayn")}${activeService ? ` (${getServiceLabel(activeService)})` : ""}` : tr("offline", "oflayn")}
              </p>
            </div>
          </div>

          <label
            className={`relative flex h-8 w-14 items-center rounded-full p-1 transition-colors ${isOnline ? "bg-primarySidebar" : "bg-slate-200"} ${loading ? "opacity-60" : "cursor-pointer"}`}
          >
            <input type="checkbox" className="sr-only" checked={isOnline} disabled={loading} onChange={(e) => toggleOnline(e.target.checked)} />
            <div className={`h-6 w-6 rounded-full bg-white shadow-md transition-transform ${isOnline ? "translate-x-6" : "translate-x-0"}`} />
          </label>
        </div>
      </div>

      <div className="px-4">
        <div className="neumorphic-pop rounded-2xl p-4 flex items-center justify-between gap-4">
          <div>
            <p className="font-bold text-slate-800">Aktiv mashina</p>
            <p className="text-sm text-slate-500">
              {activeVehicle ? `${activeVehicle.brand || ""} ${activeVehicle.model || ""} · ${activeVehicle.plateNumber || "raqamsiz"}`.trim() : "Sozlamalarda aktiv mashina tanlanmagan"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/driver/settings?tab=vehicles")}
            className="rounded-xl bg-primarySidebar px-4 py-2 text-sm font-semibold text-white shadow"
          >
            Mashinalar
          </button>
        </div>
      </div>

      <main className="p-4 space-y-6 pb-24">
        <section>
          {visibleServices.taxi ? (
            <button
              type="button"
              onClick={() => selectService("taxi")}
              className="w-full text-left neumorphic-pop rounded-2xl p-6 flex items-center justify-between border-2 border-primarySidebar/20"
            >
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center text-primarySidebar">
                  <span className="material-symbols-outlined text-4xl" data-no-auto-translate="true">local_taxi</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">{tr("taxi", "Shahar ichida taksi")}</h3>
                  <p className="text-slate-500 text-sm">{tr("cityTaxiHint", "Eng tezkor va qulay narxlar")}</p>
                </div>
              </div>
              <div className="bg-primarySidebar text-white h-12 w-12 rounded-xl flex items-center justify-center shadow-lg">
                <span className="material-symbols-outlined" data-no-auto-translate="true">arrow_forward</span>
              </div>
            </button>
          ) : null}
        </section>

        <section className="grid grid-cols-2 gap-4">
          {visibleServices.interProv ? (
            <button type="button" onClick={() => selectService("interProv")} className="neumorphic-pop rounded-2xl p-6 flex flex-col items-center text-center gap-4 border border-white/50">
              <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center text-primarySidebar">
                <span className="material-symbols-outlined text-4xl" data-no-auto-translate="true">map</span>
              </div>
              <p className="font-bold text-slate-800">{tr("interProvincial", "Viloyatlar aro")}</p>
            </button>
          ) : null}

          {visibleServices.interDist ? (
            <button type="button" onClick={() => selectService("interDist")} className="neumorphic-pop rounded-2xl p-6 flex flex-col items-center text-center gap-4 border border-white/50">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600">
                <span className="material-symbols-outlined text-4xl" data-no-auto-translate="true">distance</span>
              </div>
              <p className="font-bold text-slate-800">{tr("interDistrict", "Tumanlar aro")}</p>
            </button>
          ) : null}

          {visibleServices.freight ? (
            <button type="button" onClick={() => selectService("freight")} className="neumorphic-pop rounded-2xl p-6 flex flex-col items-center text-center gap-4 border border-white/50">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                <span className="material-symbols-outlined text-4xl" data-no-auto-translate="true">local_shipping</span>
              </div>
              <p className="font-bold text-slate-800">{tr("freight", "Yuk tashish")}</p>
            </button>
          ) : null}

          {visibleServices.delivery ? (
            <button type="button" onClick={() => selectService("delivery")} className="neumorphic-pop rounded-2xl p-6 flex flex-col items-center text-center gap-4 border border-white/50">
              <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600">
                <span className="material-symbols-outlined text-4xl" data-no-auto-translate="true">inventory_2</span>
              </div>
              <p className="font-bold text-slate-800">{tr("delivery", "Eltish xizmati")}</p>
            </button>
          ) : null}

          {!visibleServices.taxi && !visibleServices.interProv && !visibleServices.interDist && !visibleServices.freight && !visibleServices.delivery ? (
            <div className="col-span-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-5 text-amber-900">
              Sozlamalarda kamida bitta xizmatni yoqing. Aktiv mashina bo'lmasa buyurtmalar chiqmaydi.
            </div>
          ) : null}
        </section>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-200 px-6 py-2 flex justify-around items-center z-50">
        <button type="button" onClick={() => { backToMenu(); navigate("/driver/dashboard"); }} className="flex flex-col items-center gap-1 text-primarySidebar">
          <span className="material-symbols-outlined" data-no-auto-translate="true">home</span>
          <span className="text-[10px] font-bold">{tr("home", "Asosiy")}</span>
        </button>
        <button type="button" onClick={() => navigate("/driver/orders")} className="flex flex-col items-center gap-1 text-slate-400">
          <span className="material-symbols-outlined" data-no-auto-translate="true">history</span>
          <span className="text-[10px] font-medium">{tr("orderHistoryDriver", tr("orders", "Buyurtmalar tarixi"))}</span>
        </button>
        <button type="button" onClick={() => navigate("/settings")} className="flex flex-col items-center gap-1 text-slate-400">
          <span className="material-symbols-outlined" data-no-auto-translate="true">settings</span>
          <span className="text-[10px] font-medium">{tr("settingsTitle", "Sozlamalar")}</span>
        </button>
      </nav>

      <Drawer placement="right" width="100%" closable={false} onClose={() => setProfileOpen(false)} open={profileOpen} styles={{ body: { padding: 0 } }} maskClosable>
        <div ref={drawerInnerRef} style={{ height: "100%", background: "#fff", willChange: "transform", touchAction: "pan-y" }} onTouchStart={onProfileTouchStart} onTouchMove={onProfileTouchMove} onTouchEnd={onProfileTouchEnd}>
          <div style={{ padding: 12, background: "#111", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div style={{ fontWeight: 900 }}>Profil</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ fontSize: 12, opacity: 0.9 }}>{isOnline ? tr("online", "Online") : tr("offline", "Offline")}</div>
              <Switch size="small" checked={isOnline} onChange={toggleOnline} loading={loading} />
            </div>
          </div>

          <DriverProfile onBack={() => setProfileOpen(false)} onLogout={() => { setProfileOpen(false); onLogout?.(); }} />
        </div>
      </Drawer>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh" }}>
      {serviceContent ? serviceContent : menuUi}
      <RadarMiniOverlay online={driveAssistantEnabled} speedKmh={speedKmh} radar={nearestRadar} severity={radarSeverity} />
    </div>
  );
}
