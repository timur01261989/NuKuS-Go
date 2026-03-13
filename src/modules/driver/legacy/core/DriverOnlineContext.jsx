import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/services/supabase/supabaseClient";
import { startPresence, stopPresence, syncPresenceService } from "./driverPresenceManager";
import { startDot, stopDot } from "./useFloatingDot";
import { canUseMenuService, fetchDriverCapability, syncCapabilityToStorage } from "./driverCapabilityService";

const STORAGE_ONLINE = "driver_online";
const STORAGE_SERVICE = "driver_active_service";
const STORAGE_SERVICE_TYPES_CACHE = "driver_service_types_cache";
const STORAGE_ACTIVE_VEHICLE_CACHE = "driver_active_vehicle_cache";
const DriverOnlineContext = createContext(null);

export function DriverOnlineProvider({ children }) {
  const [isOnline, setIsOnline] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_ONLINE) === "1";
    } catch {
      return false;
    }
  });
  const [activeService, setActiveService] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_SERVICE) || null;
    } catch {
      return null;
    }
  });
  const [serviceTypes, setServiceTypes] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_SERVICE_TYPES_CACHE);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [activeVehicle, setActiveVehicle] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_ACTIVE_VEHICLE_CACHE);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const refreshCapabilities = useCallback(async () => {
    try {
      const capability = await fetchDriverCapability();
      setServiceTypes(capability?.serviceTypes || null);
      setActiveVehicle(capability?.activeVehicle || null);
      syncCapabilityToStorage(capability);
      if (capability?.serviceTypes) setServiceTypes(capability.serviceTypes);
      if (capability?.activeVehicle) setActiveVehicle(capability.activeVehicle);
      return capability;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    try {
      refreshCapabilities();
      if (localStorage.getItem(STORAGE_ONLINE) === "1") {
        Promise.resolve(startPresence(localStorage.getItem(STORAGE_SERVICE) || null)).catch(() => {});
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
