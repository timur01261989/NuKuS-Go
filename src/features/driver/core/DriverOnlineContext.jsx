import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { startPresence, stopPresence, syncPresenceService } from "./driverPresenceManager";
import { startDot, stopDot } from "./useFloatingDot";

const STORAGE_ONLINE = "driver_online";
const STORAGE_SERVICE = "driver_active_service";
const DriverOnlineContext = createContext(null);

export function DriverOnlineProvider({ children }) {
  const [isOnline, setIsOnline] = useState(false);
  const [activeService, setActiveService] = useState(null);

  useEffect(() => {
    try {
      const storedOnline = localStorage.getItem(STORAGE_ONLINE) === "1";
      const storedService = localStorage.getItem(STORAGE_SERVICE) || null;
      setIsOnline(storedOnline);
      setActiveService(storedService);
      if (storedOnline) {
        Promise.resolve(startPresence(storedService)).catch(() => {});
        startDot();
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!isOnline) return;
    Promise.resolve(syncPresenceService(activeService)).catch(() => {});
  }, [isOnline, activeService]);

  const persist = (nextOnline, serviceType) => {
    try {
      localStorage.setItem(STORAGE_ONLINE, nextOnline ? "1" : "0");
      if (serviceType) localStorage.setItem(STORAGE_SERVICE, serviceType);
      else localStorage.removeItem(STORAGE_SERVICE);
    } catch {
      // ignore
    }
  };

  const ensureSession = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    if (!data?.user) throw new Error('driver_not_authenticated');
    return data.user;
  };

  const setOnline = async (serviceType) => {
    await ensureSession();
    const nextService = serviceType || activeService || null;
    setIsOnline(true);
    setActiveService(nextService);
    persist(true, nextService);
    await Promise.resolve(startPresence(nextService)).catch(() => {});
    await Promise.resolve(syncPresenceService(nextService)).catch(() => {});
    startDot();
  };

  const setOffline = async () => {
    setIsOnline(false);
    setActiveService(null);
    persist(false, null);
    await Promise.resolve(stopPresence()).catch(() => {});
    await Promise.resolve(syncPresenceService(null)).catch(() => {});
    stopDot();
  };

  const value = useMemo(() => ({ isOnline, activeService, setOnline, setOffline }), [isOnline, activeService]);
  return <DriverOnlineContext.Provider value={value}>{children}</DriverOnlineContext.Provider>;
}

export function useDriverOnline() {
  const ctx = useContext(DriverOnlineContext);
  if (!ctx) throw new Error("useDriverOnline must be used inside DriverOnlineProvider");
  return ctx;
}
