import { useCallback, useMemo } from "react";

export default function useGeoLocation() {
  const getCurrentPosition = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      return Promise.reject(new Error("Geolocation is not supported"));
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 2000,
      });
    });
  }, []);

  return useMemo(() => ({ getCurrentPosition }), [getCurrentPosition]);
}
