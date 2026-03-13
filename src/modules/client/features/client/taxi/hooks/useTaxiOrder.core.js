import { translateClientPhrase } from "../../shared/i18n_clientLocalize";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { message } from "antd";
import { haversineKm } from "../../shared/geo/haversine";
import { nominatimReverse as _nominatimReverse } from "../../shared/geo/nominatim";
import { useTaxiSearch, nominatimSearch } from "./useTaxiSearch";
import { useTaxiRouteBuilder, osrmRouteMulti } from "./useTaxiRouteBuilder";
import { useTaxiOrderCreate } from "./useTaxiOrderCreate";
import { useTaxiOrderState } from "./useTaxiOrderState";
import { useTaxiOrderActions } from "./useTaxiOrderActions";
import { useTaxiOrderLifecycle } from "./useTaxiOrderLifecycle";
import { useTaxiOrderDerived } from "./useTaxiOrderDerived";
import { loadMyAddressesV1, loadSavedPlaces, loadTaxiShortcuts, savePlace } from "../lib/taxiStorage";
import { speak } from "../lib/taxiSpeech";
import { money, clamp } from "../lib/taxiPricing";

// Constants
export const MAX_KM = 50;
export const tileDay = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
export const tileNight = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

// Backward-compatible nominatim reverse geocoding
async function nominatimReverse(lat, lng, signal) {
  return _nominatimReverse(lat, lng, { signal });
}

// Debounced reverse geocoding hook
export function useDebouncedReverse(when, latlng, delay = 350) {
  const [addr, setAddr] = useState("");
  const abortRef = useRef(null);
  const tRef = useRef(null);

  useEffect(() => {
    if (!when) return;
    if (!latlng) return;

    if (tRef.current) clearTimeout(tRef.current);
    if (abortRef.current) abortRef.current.abort();

    const ac = new AbortController();
    abortRef.current = ac;

    tRef.current = setTimeout(async () => {
      const a = await nominatimReverse(latlng[0], latlng[1], ac.signal);
      setAddr(a || "");
    }, delay);

    return () => {
      if (tRef.current) clearTimeout(tRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [when, latlng?.[0], latlng?.[1], delay]);

  return addr;
}

// Main taxi order hook
export function useTaxiOrderCore() {
  const currentLang = (() => { try { return localStorage.getItem("appLang") || "uz_lotin"; } catch { return "uz_lotin"; } })();
  const cp = (x) => translateClientPhrase(currentLang, x);

  // Flow state
  const [step, setStep] = useState("main");
  const [darkMode, setDarkMode] = useState(false);

  // Locations
  const [userLoc, setUserLoc] = useState(null);
  const [pickup, setPickup] = useState({ latlng: null, address: "", entrance: "" });
  const [dest, setDest] = useState({ latlng: null, address: "" });
  const [waypoints, setWaypoints] = useState([]);

  // Map center tracking
  const [centerLatLng, setCenterLatLng] = useState(null);
  const [isDraggingMap, setIsDraggingMap] = useState(false);

  // Search drawer
  const [searchOpen, setSearchOpen] = useState(false);
  const [pickupSearchText, setPickupSearchText] = useState("");
  const [destSearchText, setDestSearchText] = useState("");
  const [pickupResults, setPickupResults] = useState([]);
  const [destResults, setDestResults] = useState([]);
  const [searchBusy, setSearchBusy] = useState(false);

  // Saved places and shortcuts
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [myAddressesV1, setMyAddressesV1] = useState(() => loadMyAddressesV1());
  const [shortcuts, setShortcuts] = useState({ home: null, work: null });

  // Route and tariff
  const [route, setRoute] = useState(null);
  const [tariff, setTariff] = useState({ id: "start", title: "Start", mult: 1, base: 4500, perKm: 1400 });
  const tariffs = useMemo(
    () => [
      { id: "start", title: "Start", mult: 1, base: 4500, perKm: 1400 },
      { id: "comfort", title: "Komfort", mult: 1.2, base: 6500, perKm: 1700 },
      { id: "business", title: "Biznes", mult: 1.5, base: 9000, perKm: 2200 },
    ],
    []
  );

  // Order and driver
  const orderState = useTaxiOrderState();
  const {
    orderId,
    setOrderId,
    orderStatus,
    setOrderStatus,
    assignedDriver,
    setAssignedDriver,
    ratingVisible,
    setRatingVisible,
    completedOrderForRating,
    setCompletedOrderForRating,
    bonusVisible,
    setBonusVisible,
    earnedBonus,
    setEarnedBonus,
    etaMin,
    setEtaMin,
  } = orderState;

  // Order extras
  const [podyezdOpen, setPodyezdOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [addStopOpen, setAddStopOpen] = useState(false);
  const [orderFor, setOrderFor] = useState("self");
  const [otherPhone, setOtherPhone] = useState("");
  const [wishesOpen, setWishesOpen] = useState(false);
  const [wishes, setWishes] = useState({
    ac: false,
    trunk: false,
    childSeat: false,
    smoking: "no",
  });
  const [comment, setComment] = useState("");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduledTime, setScheduledTime] = useState(null);

  // Live cars during search
  const [nearCars, setNearCars] = useState([]);
  const [dispatchLine, setDispatchLine] = useState(null);
  const [dispatchIdx, setDispatchIdx] = useState(0);

  // Debounced addresses
  const pickupAddrFromCenter = useDebouncedReverse(step === "main" || step === "search", centerLatLng, 300);
  const destAddrFromCenter = useDebouncedReverse(step === "dest_map", centerLatLng, 300);

  // Memoized home/work addresses
  const homeAddr = useMemo(() => myAddressesV1.find(x => String(x?.label || '').toLowerCase() === 'uy') || null, [myAddressesV1]);
  const workAddr = useMemo(() => myAddressesV1.find(x => String(x?.label || '').toLowerCase() === 'ish') || null, [myAddressesV1]);

  // Distance and price calculations
  const distanceKm = useMemo(
    () => route?.distanceKm || (pickup.latlng && dest.latlng ? haversineKm(pickup.latlng, dest.latlng) : 0),
    [route?.distanceKm, pickup.latlng, dest.latlng]
  );

  const durationMin = useMemo(
    () => route?.durationMin || (distanceKm ? distanceKm * 2 : 0),
    [route?.durationMin, distanceKm]
  );

  const totalPrice = useMemo(() => {
    const d = distanceKm || 0;
    const p = (tariff.base + d * tariff.perKm) * (tariff.mult || 1);
    return Math.round(p);
  }, [distanceKm, tariff]);

  // Search result filtering
  const searchResults = useMemo(() => {
    const qDest = (destSearchText || "").trim();
    if (qDest) return destResults;
    return pickupResults;
  }, [destSearchText, destResults, pickupResults]);

  // Update pickup address from map center
  useEffect(() => {
    if ((step === "main" || step === "search") && pickupAddrFromCenter) {
      setPickup((p) => ({ ...p, address: pickupAddrFromCenter, latlng: centerLatLng }));
    }
  }, [pickupAddrFromCenter, step]);

  // Update destination address from center
  useEffect(() => {
    if (step === "dest_map" && destAddrFromCenter) {
      setDest((d) => ({ ...d, address: destAddrFromCenter, latlng: centerLatLng }));
    }
  }, [destAddrFromCenter, step]);

  // Storage sync for my addresses
  useEffect(() => {
    const onStorage = (e) => {
      if (e?.key === "savedAddresses_v1") setMyAddressesV1(loadMyAddressesV1());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Get user location on mount
  useEffect(() => {
    const saved = loadSavedPlaces();
    setSavedPlaces(saved);
    setShortcuts(loadTaxiShortcuts());

    let mounted = true;
    const ok = (pos) => {
      if (!mounted) return;
      const ll = [pos.coords.latitude, pos.coords.longitude];
      setUserLoc(ll);
      setPickup((p) => ({ ...p, latlng: ll }));
    };
    const fail = () => {
      const ll = [42.4602, 59.6156];
      setUserLoc(ll);
      setPickup((p) => ({ ...p, latlng: ll }));
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(ok, fail, {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 2000,
      });
    } else {
      fail();
    }

    return () => {
      mounted = false;
    };
  }, []);

  // Sync pickup address from center pin
  useEffect(() => {
    if (!(step === "main" || step === "search")) return;
    if (!centerLatLng) return;
    setPickup((p) => ({ ...p, latlng: centerLatLng, address: pickupAddrFromCenter || p.address }));
  }, [pickupAddrFromCenter]);

  // Sync destination address from center pin
  useEffect(() => {
    if (step !== "dest_map") return;
    if (!centerLatLng) return;
    setDest((d) => ({ ...d, latlng: centerLatLng, address: destAddrFromCenter || d.address }));
  }, [destAddrFromCenter]);

  useTaxiRouteBuilder({ step, pickup, dest, waypoints, setRoute });

  useTaxiSearch({
    searchOpen,
    pickupSearchText,
    destSearchText,
    setPickupResults,
    setDestResults,
    setSearchBusy,
  });

  // Callback: set pickup from suggestion
  const setPickupFromSuggestion = useCallback(
    (item) => {
      if (!item) return;
      const lat = item.lat ?? item.latitude ?? item?.location?.lat;
      const lng = item.lng ?? item.lon ?? item.longitude ?? item?.location?.lng;
      const address = item.address ?? item.title ?? item.name ?? "";
      if (lat != null && lng != null) {
        setPickup((p) => ({ ...p, latlng: [Number(lat), Number(lng)], address: address || p.address }));
      } else {
        setPickup((p) => ({ ...p, address: address || p.address }));
      }
      setPickupSearchText(address);
      setSearchOpen(false);
      if (dest?.latlng) setStep("route");
    },
    [dest?.latlng]
  );

  // Callback: set destination from suggestion
  const setDestFromSuggestion = useCallback(
    (item) => {
      if (!item) return;
      const lat = item.lat ?? item.latitude ?? item?.location?.lat;
      const lng = item.lng ?? item.lon ?? item.longitude ?? item?.location?.lng;
      const address = item.address ?? item.title ?? item.name ?? "";
      if (lat != null && lng != null) {
        setDest((d) => ({ ...d, latlng: [Number(lat), Number(lng)], address: address || d.address }));
      } else {
        setDest((d) => ({ ...d, address: address || d.address }));
      }
      setDestSearchText(address);
      setSearchOpen(false);
      if (pickup?.latlng) setStep("route");
    },
    [pickup?.latlng]
  );

  // Apply destination from address string (Uy/Ish)
  const applyDestinationFromAddressString = useCallback(
    async (addressStr) => {
      const q = String(addressStr || "").trim();
      if (!q) return;
      try {
        const results = await nominatimSearch(q);
        const first = Array.isArray(results) ? results[0] : null;
        if (!first) {
          message.error(cp("Manzil topilmadi"));
          return;
        }
        const ll = [Number(first.lat), Number(first.lng)];
        const addr = first.label || first.address || q;
        setDest({ latlng: ll, address: addr });
        setDestSearchText(addr);
        setSearchOpen(false);
        if (pickup?.latlng) setStep("route");
        else setStep("main");
      } catch (e) {
        message.error(cp("Manzilni aniqlab bo'lmadi"));
      }
    },
    [pickup?.latlng]
  );

  const currentUserId = useMemo(() => {
    const storageKeys = ["user_id", "userId", "uid", "auth_user_id", "supabase.auth.user.id"];

    for (const key of storageKeys) {
      try {
        const directValue = localStorage.getItem(key) || sessionStorage.getItem(key);
        if (directValue && String(directValue).trim()) {
          return String(directValue).trim();
        }
      } catch (_) {}
    }

    const storages = [typeof localStorage !== "undefined" ? localStorage : null, typeof sessionStorage !== "undefined" ? sessionStorage : null].filter(Boolean);

    const readNestedUserId = (value) => {
      if (!value || typeof value !== "object") return null;
      const candidates = [value.id, value.user_id, value.userId, value.uid, value.sub];
      for (const candidate of candidates) {
        if (candidate != null && String(candidate).trim()) return String(candidate).trim();
      }
      const nestedKeys = ["user", "session", "profile", "currentUser", "auth"];
      for (const nestedKey of nestedKeys) {
        const nestedValue = value[nestedKey];
        const nestedResult = readNestedUserId(nestedValue);
        if (nestedResult) return nestedResult;
      }
      return null;
    };

    for (const storage of storages) {
      try {
        for (let index = 0; index < storage.length; index += 1) {
          const key = storage.key(index);
          if (!key) continue;
          const raw = storage.getItem(key);
          if (!raw) continue;
          try {
            const parsed = JSON.parse(raw);
            const resolved = readNestedUserId(parsed);
            if (resolved) return resolved;
          } catch (_) {}
        }
      } catch (_) {}
    }

    return null;
  }, []);

  const handleOrderCreate = useTaxiOrderCreate({ userId: currentUserId, cp, pickup, dest, tariff, totalPrice, distanceKm, waypoints, orderFor, otherPhone, wishes, comment, scheduledTime, setOrderId, setOrderStatus, setStep, speak });

  const { handleCancel } = useTaxiOrderActions({
    cp,
    orderId,
    setStep,
    setOrderId,
    setOrderStatus,
    setAssignedDriver,
    setNearCars,
    setDispatchLine,
    speak,
  });

  useTaxiOrderLifecycle({
    orderId,
    pickup,
    orderStatus,
    step,
    assignedDriver,
    setOrderId,
    setOrderStatus,
    setPickup,
    setDest,
    setStep,
    setAssignedDriver,
    setCompletedOrderForRating,
    setRatingVisible,
    setEarnedBonus,
    setEtaMin,
    cp,
    speak,
  });

  // Production mode: do NOT render fake nearby cars.
  // Nearby cars must come only from real approved online drivers.
  useEffect(() => {
    if (step !== "searching") {
      setNearCars([]);
      setDispatchLine([]);
      setDispatchIdx(0);
      return;
    }

    setNearCars([]);
    setDispatchLine([]);
    setDispatchIdx(0);
  }, [step, pickup.latlng, setNearCars, setDispatchLine]);

  const {
    isSearching,
    isDriverAssigned,
    showSheet,
    shareLink,
    mapBottom,
  } = useTaxiOrderDerived({
    orderStatus,
    orderId,
    step,
    isDraggingMap,
  });

  return {
    step,
    setStep,
    darkMode,
    setDarkMode,
    userLoc,
    setUserLoc,
    pickup,
    setPickup,
    dest,
    setDest,
    waypoints,
    setWaypoints,
    centerLatLng,
    setCenterLatLng,
    isDraggingMap,
    setIsDraggingMap,
    searchOpen,
    setSearchOpen,
    pickupSearchText,
    setPickupSearchText,
    destSearchText,
    setDestSearchText,
    pickupResults,
    destResults,
    searchBusy,
    searchResults,
    savedPlaces,
    setSavedPlaces,
    myAddressesV1,
    homeAddr,
    workAddr,
    route,
    setRoute,
    tariff,
    setTariff,
    tariffs,
    orderId,
    setOrderId,
    orderStatus,
    setOrderStatus,
    assignedDriver,
    setAssignedDriver,
    ratingVisible,
    setRatingVisible,
    completedOrderForRating,
    setCompletedOrderForRating,
    bonusVisible,
    setBonusVisible,
    earnedBonus,
    setEarnedBonus,
    etaMin,
    setEtaMin,
    podyezdOpen,
    setPodyezdOpen,
    shareOpen,
    setShareOpen,
    addStopOpen,
    setAddStopOpen,
    orderFor,
    setOrderFor,
    otherPhone,
    setOtherPhone,
    wishesOpen,
    setWishesOpen,
    wishes,
    setWishes,
    comment,
    setComment,
    scheduleOpen,
    setScheduleOpen,
    scheduledTime,
    setScheduledTime,
    shortcuts,
    setShortcuts,
    nearCars,
    setNearCars,
    dispatchLine,
    setDispatchLine,
    dispatchIdx,
    setDispatchIdx,
    pickupAddrFromCenter,
    destAddrFromCenter,
    distanceKm,
    durationMin,
    totalPrice,
    showSheet,
    shareLink,
    mapBottom,
    isSearching,
    isDriverAssigned,
    setPickupFromSuggestion,
    setDestFromSuggestion,
    applyDestinationFromAddressString,
    handleOrderCreate,
    handleCancel,
  };
}
