import { useEffect, useMemo } from "react";
import { updateDriverPresence } from "../services/driverPresenceService";

export function useDriverPresence(driverId, serviceType, options = {}) {
  const intervalMs = useMemo(() => {
    const value = Number(options.intervalMs ?? 5000);
    return Number.isFinite(value) && value >= 2000 ? value : 5000;
  }, [options.intervalMs]);

  useEffect(() => {
    if (!driverId || typeof navigator === "undefined" || !navigator.geolocation) {
      return undefined;
    }

    let isMounted = true;

    const publish = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!isMounted) return;
          void updateDriverPresence(
            driverId,
            position.coords.latitude,
            position.coords.longitude,
            serviceType,
          );
        },
        () => {},
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 4000 },
      );
    };

    publish();
    const intervalId = window.setInterval(publish, intervalMs);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [driverId, intervalMs, serviceType]);
}

export default useDriverPresence;
