import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { message } from "antd";
import { supabase } from "@/services/supabase/supabaseClient.js";
import { fetchDriverCore } from "@/modules/shared/auth/driverCoreAccess";
import { useDriverOnline } from "../core/useDriverOnline";
import { useSpeedometer } from "../speed/useSpeedometer";
import { useRadar } from "../radar/useRadar";
import {
  buildActiveVehicleSummary,
  buildDriverServiceCards,
  buildDriverStatusText,
  resolveServiceAvailability,
  resolveVisibleServices,
} from "./driverHome.selectors.js";
import {
  buildFallbackVisibleServices,
  getPreferredServiceKey,
  safeShortId,
} from "./DriverHome.helpers.jsx";

export function useDriverHomeController({ tr, t }) {
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

  const [selectedService, setSelectedService] = useState(
    (typeof window !== "undefined" ? localStorage.getItem("driver_active_service") : null) || null
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fallbackVisibleServices = useMemo(() => {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem("driver_service_types_cache") : null;
    return buildFallbackVisibleServices(raw);
  }, []);

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

  useEffect(() => {
    const onPopState = () => {
      setSelectedService((prev) => {
        if (!prev) return prev;
        if (typeof window !== "undefined") localStorage.removeItem("driver_active_service");
        return null;
      });
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const backToMenu = useCallback(() => {
    setSelectedService(null);
    if (typeof window !== "undefined") localStorage.removeItem("driver_active_service");
  }, []);

  const selectService = useCallback((key) => {
    if (!canUseService?.(key)) {
      message.warning(tr("serviceDisabled", "Bu xizmat sizning sozlamalaringizda yoqilmagan"));
      return;
    }
    setSelectedService(key);
    if (typeof window !== "undefined") {
      localStorage.setItem("driver_active_service", key);
      window.history.pushState({ service: key }, '', window.location.pathname);
    }
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
  }, [tr]);

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

  const setDrawerTranslate = useCallback((x, withTransition = false) => {
    const el = drawerInnerRef.current;
    if (!el) return;
    el.style.transition = withTransition ? "transform 220ms cubic-bezier(.2,.8,.2,1)" : "none";
    el.style.transform = `translateX(${x}px)`;
  }, []);

  const touchRef = useRef({
    startX: 0,
    lastX: 0,
    lastT: 0,
    dx: 0,
    velocity: 0,
    dragging: false,
  });

  const onProfileTouchStart = useCallback((e) => {
    const el = drawerInnerRef.current;
    if (!el) return;
    const x = e.touches?.[0]?.clientX ?? 0;
    touchRef.current.startX = x;
    touchRef.current.lastX = x;
    touchRef.current.lastT = performance.now();
    touchRef.current.dx = 0;
    touchRef.current.velocity = 0;
    touchRef.current.dragging = true;
    el.style.transition = "none";
  }, []);

  const onProfileTouchMove = useCallback((e) => {
    const el = drawerInnerRef.current;
    if (!el || !touchRef.current.dragging) return;
    const x = e.touches?.[0]?.clientX ?? 0;
    const tNow = performance.now();
    let dx = x - touchRef.current.startX;
    if (dx < 0) dx = 0;
    const maxRight = drawerWidthPxRef.current;
    let translate = dx;
    if (translate > maxRight) {
      const overshoot = Math.max(0, translate - maxRight);
      translate = maxRight + overshoot * 0.18;
    }
    const dt = Math.max(1, tNow - touchRef.current.lastT);
    const dX = x - touchRef.current.lastX;
    touchRef.current.lastX = x;
    touchRef.current.lastT = tNow;
    touchRef.current.dx = dx;
    touchRef.current.velocity = dX / dt;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => setDrawerTranslate(translate, false));
  }, [setDrawerTranslate]);

  const onProfileTouchEnd = useCallback(() => {
    const el = drawerInnerRef.current;
    if (!el || !touchRef.current.dragging) return;

    touchRef.current.dragging = false;
    const shouldClose = touchRef.current.dx > 90 || touchRef.current.velocity > 0.6;
    if (shouldClose) {
      setDrawerTranslate(drawerWidthPxRef.current, true);
      setTimeout(() => setProfileOpen(false), 220);
    } else {
      setDrawerTranslate(0, true);
    }
  }, [setDrawerTranslate]);

  useEffect(() => {
    if (!profileOpen && drawerInnerRef.current) {
      drawerInnerRef.current.style.transition = "none";
      drawerInnerRef.current.style.transform = "translateX(0px)";
    }
  }, [profileOpen]);

  const visibleServices = useMemo(() => resolveVisibleServices(canUseService), [canUseService]);
  const resolvedVisibleServices = useMemo(
    () => resolveServiceAvailability(visibleServices, fallbackVisibleServices),
    [visibleServices, fallbackVisibleServices]
  );
  const serviceCards = useMemo(
    () => buildDriverServiceCards({ tr, resolvedVisibleServices }),
    [tr, resolvedVisibleServices]
  );
  const driverStatusLabel = useMemo(
    () => buildDriverStatusText({ isOnline, activeService, getServiceLabel: (key) => serviceCards.find((i)=>i.key===key)?.label || key, tr }),
    [isOnline, activeService, tr, serviceCards]
  );
  const activeVehicleSummary = useMemo(() => buildActiveVehicleSummary(activeVehicle), [activeVehicle]);

  return {
    isOnline,
    activeService,
    activeVehicle,
    selectedService,
    setSelectedService,
    sidebarOpen,
    setSidebarOpen,
    profileOpen,
    setProfileOpen,
    loading,
    driverHeader,
    driveAssistantEnabled,
    speedKmh,
    nearestRadar,
    radarSeverity,
    backToMenu,
    selectService,
    toggleOnline,
    drawerInnerRef,
    onProfileTouchStart,
    onProfileTouchMove,
    onProfileTouchEnd,
    serviceCards,
    driverStatusLabel,
    activeVehicleSummary,
  };
}
