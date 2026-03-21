import { useCallback, useEffect, useMemo, useState } from "react";
import { buildRoute } from "@/providers/route/index.js";
import useRealtimeDrivers from "@/modules/driver/legacy/hooks/useRealtimeDrivers.js";
import { setupNotifications } from "../services/notifications";

export const DEFAULT_LOC = [42.4619, 59.6166];

export function useMainPageController({ tx }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectingFromMap, setSelectingFromMap] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [showPricing, setShowPricing] = useState(true);
  const [userLoc, setUserLoc] = useState(DEFAULT_LOC);
  const [targetLoc, setTargetLoc] = useState(DEFAULT_LOC);
  const [userAddress, setUserAddress] = useState(tx("loadingRoute", "Aniqlanmoqda..."));
  const [targetAddress, setTargetAddress] = useState(tx("addressNotSelected", "Manzil tanlanmagan"));
  const [distanceMeters, setDistanceMeters] = useState(0);
  const [routePoints, setRoutePoints] = useState([]);

  const distanceKm = useMemo(() => (distanceMeters / 1000).toFixed(1), [distanceMeters]);
  const priceUzs = useMemo(() => Math.max(9000, Math.round((distanceMeters / 1000) * 2500)), [distanceMeters]);

  const haptic = useCallback(() => {
    if (navigator.vibrate) navigator.vibrate(20);
  }, []);

  const { drivers } = useRealtimeDrivers({
    enabled: true,
    center: userLoc,
    radiusMeters: 2000,
  });

  useEffect(() => {
    setupNotifications();
  }, []);

  const reverseGeocode = useCallback(async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      if (data?.display_name) return data.display_name.split(",").slice(0, 2).join(", ");
      return null;
    } catch {
      return null;
    }
  }, []);

  const setUserAddrByCoords = useCallback(async (lat, lng) => {
    const addr = await reverseGeocode(lat, lng);
    if (addr) setUserAddress(addr);
  }, [reverseGeocode]);

  const setTargetAddrByCoords = useCallback(async (lat, lng) => {
    const addr = await reverseGeocode(lat, lng);
    if (addr) setTargetAddress(addr);
  }, [reverseGeocode]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setUserAddrByCoords(DEFAULT_LOC[0], DEFAULT_LOC[1]);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserLoc([lat, lng]);
        setTargetLoc([lat, lng]);
        setUserAddrByCoords(lat, lng);
      },
      () => {
        setUserLoc(DEFAULT_LOC);
        setTargetLoc(DEFAULT_LOC);
        setUserAddrByCoords(DEFAULT_LOC[0], DEFAULT_LOC[1]);
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, [setUserAddrByCoords]);

  useEffect(() => {
    if (!targetLoc?.length) return;
    setTargetAddrByCoords(targetLoc[0], targetLoc[1]);
  }, [targetLoc, setTargetAddrByCoords]);

  const showRoute = useMemo(() => showPricing && !!userLoc?.length && !!targetLoc?.length, [showPricing, userLoc, targetLoc]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!showRoute) {
        setRoutePoints([]);
        setDistanceMeters(0);
        return;
      }
      if (!userLoc?.length || !targetLoc?.length) return;

      try {
        const pickup = { lat: userLoc[0], lng: userLoc[1] };
        const dropoff = { lat: targetLoc[0], lng: targetLoc[1] };
        const route = await buildRoute({ pickup, dropoff, overview: "full", geometries: "geojson" });
        if (cancelled) return;

        const meters = Number(route?.distance_m ?? (route?.distance_km ? route.distance_km * 1000 : 0)) || 0;
        setDistanceMeters(meters);

        const coords = route?.coordinates || route?.geometry?.coordinates || route?.polyline?.coordinates || [];
        const points = Array.isArray(coords)
          ? coords
              .map((coord) => (Array.isArray(coord) ? [coord[1], coord[0]] : coord))
              .filter((point) => Array.isArray(point) && point.length === 2)
          : [];
        setRoutePoints(points);
      } catch (error) {
        if (!cancelled) {
          console.error("[buildRoute] error:", error);
          setRoutePoints([]);
          setDistanceMeters(0);
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [showRoute, userLoc, targetLoc]);

  const toggleSelecting = useCallback(() => {
    setSelectingFromMap((prev) => !prev);
    setIsMoving(false);
  }, []);

  const toggleSearch = useCallback(() => {
    setIsSearching((prev) => !prev);
  }, []);

  const onPickTarget = useCallback((latlng) => {
    setTargetLoc(latlng);
    setIsMoving(false);
  }, []);

  return {
    menuOpen,
    setMenuOpen,
    selectingFromMap,
    isSearching,
    isMoving,
    setIsMoving,
    showPricing,
    setShowPricing,
    userLoc,
    targetLoc,
    userAddress,
    targetAddress,
    distanceMeters,
    routePoints,
    distanceKm,
    priceUzs,
    haptic,
    drivers,
    showRoute,
    toggleSelecting,
    toggleSearch,
    onPickTarget,
  };
}
