import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { startPresence, stopPresence, syncPresenceService } from "./driverPresenceManager";
import { startDot, stopDot } from "./useFloatingDot";
import { canUseMenuService, fetchDriverCapability, syncCapabilityToStorage } from "./driverCapabilityService";

const STORAGE_ONLINE = "driver_online";
const STORAGE_SERVICE = "driver_active_service";
const DriverOnlineContext = createContext(null);

export function DriverOnlineProvider({ children }) {
  const [isOnline, setIsOnline] = useState(false);
  const [activeService, setActiveService] = useState(null);
  const [serviceTypes, setServiceTypes] = useState(null);
  const [activeVehicle, setActiveVehicle] = useState(null);

  const refreshCapabilities = useCallback(async () => {
    try {
      const capability = await fetchDriverCapability();
      setServiceTypes(capability?.serviceTypes || null);
      setActiveVehicle(capability?.activeVehicle || null);
      syncCapabilityToStorage(capability);
      return capability;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    try {
      const storedOnline = localStorage.getItem(STORAGE_ONLINE) === "1";
      const storedService = localStorage.getItem(STORAGE_SERVICE) || null;
      setIsOnline(storedOnline);
      setActiveService(storedService);
      refreshCapabilities();
      if (storedOnline) {
        Promise.resolve(startPresence(storedService)).catch(() => {});
        startDot();
      }
    } catch {
      // ignore
    }
  }, [refreshCapabilities]);

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
    if (!data?.user) throw new Error("driver_not_authenticated");
    return data.user;
  };

  const setOnline = async (serviceType) => {
    await ensureSession();
    const nextService = serviceType || activeService || null;
    await refreshCapabilities();
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

  const canUseService = useCallback(
    (serviceKey) => canUseMenuService({ serviceTypes, activeVehicle }, serviceKey),
    [serviceTypes, activeVehicle]
  );

  const value = useMemo(
    () => ({
      isOnline,
      activeService,
      serviceTypes,
      activeVehicle,
      canUseService,
      refreshCapabilities,
      setOnline,
      setOffline,
    }),
    [isOnline, activeService, serviceTypes, activeVehicle, canUseService, refreshCapabilities]
  );
  return <DriverOnlineContext.Provider value={value}>{children}</DriverOnlineContext.Provider>;
}

export function useDriverOnline() {
  const ctx = useContext(DriverOnlineContext);
  if (!ctx) throw new Error("useDriverOnline must be used inside DriverOnlineProvider");
  return ctx;
}
