import { useCallback, useEffect, useRef, useState } from "react";

export function useLocationFeatures({ enabled = true } = {}) {
  const [driverLoc, setDriverLoc] = useState(null);
  const watchRef = useRef(null);

  const start = useCallback(() => {
    if (!navigator.geolocation) return;
    watchRef.current = navigator.geolocation.watchPosition(
      (p) => setDriverLoc([p.coords.latitude, p.coords.longitude]),
      () => {},
      { enableHighAccuracy: true, maximumAge: 8000, timeout: 15000 }
    );
  }, []);

  const stop = useCallback(() => {
    if (watchRef.current != null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    start();
    return stop;
  }, [enabled, start, stop]);

  const openNav = useCallback((latlng) => {
    if (!latlng) return;
    const [lat, lng] = latlng;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`, "_blank");
  }, []);

  return { driverLoc, setDriverLoc, openNav };
}
