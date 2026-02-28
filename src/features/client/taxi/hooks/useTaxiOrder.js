import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { message } from "antd";
import api from "@/utils/apiHelper";
import { haversineKm } from "../shared/geo/haversine";
import { nominatimReverse as _nominatimReverse } from "../shared/geo/nominatim";
import { nominatimSearch } from "../services/nominatim"; // Import yo'lini loyihangizga moslang

// --- Yordamchi Funksiyalar (Utils) ---

// Backward-compatible signature
async function nominatimReverse(lat, lng, signal) {
  return _nominatimReverse(lat, lng, { signal });
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

// OSRM yo'nalish topish
async function osrmRouteMulti(points) {
  if (!points || points.length < 2) return null;
  try {
    const pairs = points
      .filter(Boolean)
      .map((p) => `${p[1]},${p[0]}`)
      .join(";");
    const url = `https://router.project-osrm.org/route/v1/driving/${pairs}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();
    const r = data?.routes?.[0];
    if (r) {
      const coords = r.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      return {
        coords,
        distanceKm: (r.distance || 0) / 1000,
        durationMin: (r.duration || 0) / 60,
      };
    }
  } catch (e) {
    console.warn("OSRM yo'nalish chizishda xatolik:", e);
  }
  const from = points[0];
  const to = points[points.length - 1];
  return {
    coords: [from, to],
    distanceKm: haversineKm(from, to),
    durationMin: haversineKm(from, to) * 2,
  };
}

export function money(n) {
  const x = Math.round(Number(n || 0));
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " so'm";
}

function useDebouncedReverse(when, latlng, delay = 350) {
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

// Local Storage helpers
function loadMyAddressesV1() {
  try {
    const raw = localStorage.getItem("savedAddresses_v1");
    const arr = raw ? JSON.parse(raw) : [];
    if (Array.isArray(arr)) return arr;
  } catch {}
  return [];
}
function loadSavedPlaces() {
  try {
    const raw = localStorage.getItem("client_saved_places");
    const arr = raw ? JSON.parse(raw) : [];
    if (Array.isArray(arr)) return arr;
  } catch {}
  return [];
}
function savePlace(place) {
  const list = loadSavedPlaces();
  const exists = list.find((x) => x.id === place.id);
  const next = exists ? list.map((x) => (x.id === place.id ? place : x)) : [place, ...list].slice(0, 20);
  localStorage.setItem("client_saved_places", JSON.stringify(next));
  return next;
}

function speak(text) {
  try {
    if (!("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ru-RU";
    u.rate = 1;
    u.pitch = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {}
}

const MAX_KM = 50;

// --- ASOSIY HOOK ---
export function useTaxiOrder() {
  const mapRef = useRef(null);
  const tariffSectionRef = useRef(null);
  const scrollTariffOnOpenRef = useRef(false);

  // theme
  const [darkMode, setDarkMode] = useState(false);

  // flow
  const [step, setStep] = useState("main");

  // mobile BACK handling
  const isPopNavRef = useRef(false);
  const stepRef = useRef(step);

  useEffect(() => {
    const st = { __taxiStep: step };
    if (!isPopNavRef.current) {
      try {
        window.history.pushState(st, "");
      } catch {}
    }
    isPopNavRef.current = false;
  }, [step]);

  useEffect(() => { stepRef.current = step; }, [step]);

  useEffect(() => {
    const onPop = (e) => {
      isPopNavRef.current = true;
      const cur = stepRef.current;
      if (cur === "stop_map") { setStep("route"); return; }
      if (cur === "searching" || cur === "coming") { setStep("route"); return; }
      if (cur === "route") { setStep("main"); return; }
      if (cur === "dest_map") { setStep("search"); return; }
      if (cur === "search") { setStep("main"); return; }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const requestLocateNow = useCallback(() => {
    if (!navigator.geolocation) {
      message.error("Geolokatsiya mavjud emas");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const ll = [pos.coords.latitude, pos.coords.longitude];
        setUserLoc(ll);
        setPickup((p) => ({ ...p, latlng: ll }));
        const map = mapRef.current;
        if (map) map.flyTo(ll, 16, { duration: 0.6 });
      },
      () => { message.error("Joylashuvni aniqlab bo‘lmadi"); },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }, []);

  // locations
  const [userLoc, setUserLoc] = useState(null);
  const [pickup, setPickup] = useState({ latlng: null, address: "", entrance: "" });
  const [dest, setDest] = useState({ latlng: null, address: "" });
  const [waypoints, setWaypoints] = useState([]);
  const [addStopOpen, setAddStopOpen] = useState(false);

  // map tracking
  const [centerLatLng, setCenterLatLng] = useState(null);
  const [isDraggingMap, setIsDraggingMap] = useState(false);

  // search
  const [searchOpen, setSearchOpen] = useState(false);
  const [pickupSearchText, setPickupSearchText] = useState("");
  const [destSearchText, setDestSearchText] = useState("");
  const [pickupResults, setPickupResults] = useState([]);
  const [destResults, setDestResults] = useState([]);
  const [searchBusy, setSearchBusy] = useState(false);

  // saved places
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [myAddressesV1, setMyAddressesV1] = useState(() => loadMyAddressesV1());
  const homeAddr = useMemo(() => myAddressesV1.find(x => String(x?.label || '').toLowerCase() === 'uy') || null, [myAddressesV1]);
  const workAddr = useMemo(() => myAddressesV1.find(x => String(x?.label || '').toLowerCase() === 'ish') || null, [myAddressesV1]);

  // route
  const [route, setRoute] = useState(null);
  const [tariff, setTariff] = useState({ id: "start", title: "Start", mult: 1, base: 4500, perKm: 1400 });
  const tariffs = useMemo(() => [
    { id: "start", title: "Start", mult: 1, base: 4500, perKm: 1400 },
    { id: "comfort", title: "Komfort", mult: 1.2, base: 6500, perKm: 1700 },
    { id: "business", title: "Biznes", mult: 1.5, base: 9000, perKm: 2200 },
  ], []);

  // order
  const [orderId, setOrderId] = useState(null);
  const [orderStatus, setOrderStatus] = useState(null);
  const [assignedDriver, setAssignedDriver] = useState(null);
  const [ratingVisible, setRatingVisible] = useState(false);
  const [completedOrderForRating, setCompletedOrderForRating] = useState(null);
  const [bonusVisible, setBonusVisible] = useState(false);
  const [earnedBonus, setEarnedBonus] = useState(0);
  const [etaMin, setEtaMin] = useState(null);

  // modals
  const [podyezdOpen, setPodyezdOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  // order extras
  const [orderFor, setOrderFor] = useState("self");
  const [otherPhone, setOtherPhone] = useState("");
  const [wishesOpen, setWishesOpen] = useState(false);
  const [wishes, setWishes] = useState({ ac: false, trunk: false, childSeat: false, smoking: "no" });
  const [comment, setComment] = useState("");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduledTime, setScheduledTime] = useState(null);

  // shortcuts
  const [shortcuts, setShortcuts] = useState({ home: null, work: null });

  // nearby cars
  const [nearCars, setNearCars] = useState([]);
  const [dispatchLine, setDispatchLine] = useState(null);
  const [dispatchIdx, setDispatchIdx] = useState(0);

  // debounced addresses
  const pickupAddrFromCenter = useDebouncedReverse(step === "main" || step === "search", centerLatLng, 300);
  const destAddrFromCenter = useDebouncedReverse(step === "dest_map", centerLatLng, 300);

  // --- Effects ---

  useEffect(() => {
    const onStorage = (e) => {
      if (e?.key === "savedAddresses_v1") setMyAddressesV1(loadMyAddressesV1());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const pickupAbortRef = useRef(null);
  const destAbortRef = useRef(null);

  useEffect(() => {
    if (!searchOpen) return;
    const t = setTimeout(async () => {
      const q = destSearchText.trim();
      if (!q) { setDestResults([]); return; }
      if (destAbortRef.current) destAbortRef.current.abort();
      const ac = new AbortController();
      destAbortRef.current = ac;
      setSearchBusy(true);
      const res = await nominatimSearch(q, ac.signal);
      setDestResults(res);
      setSearchBusy(false);
    }, 250);
    return () => clearTimeout(t);
  }, [destSearchText, searchOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    const t = setTimeout(async () => {
      const q = pickupSearchText.trim();
      if (!q) { setPickupResults([]); return; }
      if (pickupAbortRef.current) pickupAbortRef.current.abort();
      const ac = new AbortController();
      pickupAbortRef.current = ac;
      setSearchBusy(true);
      const res = await nominatimSearch(q, ac.signal);
      setPickupResults(res);
      setSearchBusy(false);
    }, 250);
    return () => clearTimeout(t);
  }, [pickupSearchText, searchOpen]);

  // Handlers
  const setPickupFromSuggestion = useCallback((item) => {
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
  }, [dest?.latlng]);

  const setDestFromSuggestion = useCallback((item) => {
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
  }, [pickup?.latlng]);

  const openDestinationSearch = useCallback(() => {
    setSearchOpen(true);
    setStep("search");
    setPickupSearchText(pickup.address || "");
    setDestSearchText(dest.address || "");
  }, [pickup.address, dest.address]);

  const choosePickup = useCallback((item) => {
    if (!item) return;
    setPickup({ latlng: [item.lat, item.lng], address: item.label, entrance: "" });
    const map = mapRef.current;
    if (map) map.flyTo([item.lat, item.lng], 16, { duration: 0.6 });
    setSearchOpen(false);
    setStep("main");
  }, []);

  const chooseDestination = useCallback((item) => {
    if (!item) return;
    setDest({ latlng: [item.lat, item.lng], address: item.label });
    setSavedPlaces(savePlace({ id: String(item.id || Date.now()), title: item.label, lat: item.lat, lng: item.lng, type: "recent" }));
    setSearchOpen(false);
    setStep("route");
  }, []);

  const openPickupMapEdit = useCallback(() => {
    setStep("main");
    setSearchOpen(false);
    message.info("Xaritani siljitib yo'lovchini olish nuqtasini o'zgartiring");
  }, []);

  const openDestMapEdit = useCallback(() => {
    setStep("dest_map");
    setSearchOpen(false);
    const map = mapRef.current;
    if (map) {
      const c = dest.latlng || pickup.latlng || userLoc;
      if (c) map.flyTo(c, 16, { duration: 0.6 });
    }
  }, [dest.latlng, pickup.latlng, userLoc]);

  const openShareRide = useCallback(() => { setShareOpen(true); }, []);

  const addStopFromCenter = useCallback(() => {
    if (!centerLatLng) return;
    const addr = step === "dest_map" ? (destAddrFromCenter || "") : (pickupAddrFromCenter || "");
    const stop = { latlng: centerLatLng, address: addr || "Oraliq bekat" };
    setWaypoints((w) => [...w, stop].slice(0, 3));
    setAddStopOpen(false);
    message.success("Oraliq bekat qo'shildi");
  }, [centerLatLng, step, destAddrFromCenter, pickupAddrFromCenter]);

  const applyDestinationFromAddressString = useCallback(async (addressStr) => {
    const q = String(addressStr || "").trim();
    if (!q) return;
    try {
      const results = await nominatimSearch(q);
      const first = Array.isArray(results) ? results[0] : null;
      if (!first) {
        message.error("Manzil topilmadi");
        return;
      }
      const ll = [Number(first.lat), Number(first.lon)];
      const addr = first.display_name || q;
      setDest({ latlng: ll, address: addr });
      setSearchOpen(false);
      if (pickup?.latlng) setStep("route");
      else setStep("main");
    } catch (e) {
      message.error("Manzilni aniqlab bo‘lmadi");
    }
  }, [pickup?.latlng]);

  // Calculations
  const distanceKm = useMemo(() => route?.distanceKm || (pickup.latlng && dest.latlng ? haversineKm(pickup.latlng, dest.latlng) : 0), [route?.distanceKm, pickup.latlng, dest.latlng]);
  const durationMin = useMemo(() => route?.durationMin || (distanceKm ? distanceKm * 2 : 0), [route?.durationMin, distanceKm]);
  const totalPrice = useMemo(() => {
    const d = distanceKm || 0;
    const p = (tariff.base + d * tariff.perKm) * (tariff.mult || 1);
    return Math.round(p);
  }, [distanceKm, tariff]);

  const handleOrderCreate = useCallback(async () => {
    if (!pickup.latlng) {
      message.error("Yo'lovchini olish nuqtasi aniqlanmadi");
      return;
    }
    if (dest.latlng) {
      const d = distanceKm || haversineKm(pickup.latlng, dest.latlng);
      if (d > MAX_KM) {
        message.error(`Masofa belgilangan me'yoridan ortiq (${MAX_KM} km)`);
        return;
      }
    }
    const hide = message.loading("Buyurtma yuborilmoqda...", 0);
    try {
      const payloadBase = {
        status: "searching",
        price: Math.round(totalPrice),
        service_type: tariff.id,
        pickup_location: pickup.address || "Yo'lovchini olish nuqtasi",
        dropoff_location: dest.address || "",
        from_lat: pickup.latlng[0], from_lng: pickup.latlng[1],
        to_lat: dest.latlng ? dest.latlng[0] : null,
        to_lng: dest.latlng ? dest.latlng[1] : null,
        distance_km: dest.latlng ? (distanceKm || haversineKm(pickup.latlng, dest.latlng)) : 0,
        waypoints: waypoints.map((w) => ({ lat: w.latlng?.[0], lng: w.latlng?.[1], address: w.address || "" })),
        pickup_entrance: pickup.entrance || "",
        order_for: orderFor,
        other_phone: orderFor === "other" ? (otherPhone || "") : "",
        wishes: wishes,
        comment: comment || "",
        scheduled_time: scheduledTime,
      };
      const actions = ["create", "create_taxi", "create_city", "new"];
      let res = null; let lastErr = null;
      for (const action of actions) {
        try {
          res = await api.post("/api/order", { action, ...payloadBase });
          if (res?.data || res?.id || res?.orderId) break;
        } catch (e) { lastErr = e; }
      }
      const id = res?.data?.id || res?.id || res?.orderId;
      if (!id) throw lastErr || new Error("Serverdan ID kelmadi");
      setOrderId(String(id));
      localStorage.setItem("activeOrderId", String(id));
      setOrderStatus("searching");
      setStep("searching");
      speak("Haydovchi qidirilmoqda");
      message.success("Buyurtma yuborildi");
    } catch (e) {
      console.error("Order error:", e);
      message.error("Zakaz berishda xatolik: " + (e?.message || "Server bilan aloqa yo'q"));
    } finally { hide(); }
  }, [pickup, dest, tariff, totalPrice, distanceKm, waypoints, orderFor, otherPhone, wishes, comment, scheduledTime]);

  const handleCancel = useCallback(async () => {
    if (!orderId) { setStep("main"); setOrderStatus(null); return; }
    const hide = message.loading("Bekor qilinmoqda...", 0);
    try {
      await api.post("/api/order", { action: "cancel", order_id: orderId });
    } catch (e) { console.warn(e); } finally {
      hide();
      localStorage.removeItem("activeOrderId");
      setOrderId(null);
      setOrderStatus(null);
      setAssignedDriver(null);
      setNearCars([]);
      setDispatchLine(null);
      setStep("main");
      speak("Safar bekor qilindi");
    }
  }, [orderId]);

  // Polling active order
  useEffect(() => {
    if (step !== "searching") return;
    if (!pickup.latlng) return;
    if (!nearCars.length) return;
    const c = nearCars[dispatchIdx];
    if (!c) return;
    setDispatchLine([[c.lat, c.lng], pickup.latlng]);
  }, [step, dispatchIdx, nearCars, pickup.latlng]);

  const shareLink = useMemo(() => {
    if (!orderId) return "";
    try { return `${window.location.origin}/share/${orderId}`; } catch { return ""; }
  }, [orderId]);

  const showSheet = useMemo(() => {
    if (step === "dest_map") return !isDraggingMap;
    return true;
  }, [step, isDraggingMap]);

  const handlePickSaved = useCallback((p) => {
    if (!p) return;
    setDest({ latlng: [Number(p.lat), Number(p.lng)], address: p.label || p.name || "" });
    setStep("route");
  }, []);

  const updateEntrance = useCallback((val) => { setPickup((p) => ({ ...p, entrance: val })); }, []);
  const changeDestination = useCallback(() => { setStep("dest_map"); }, []);

  const mapTile = darkMode ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

  const mapBottom = useMemo(() => {
    if (step === "main") return 280;
    if (step === "search") return 340;
    if (step === "dest_map") return 240;
    if (step === "route") return 330;
    if (step === "searching") return 240;
    if (step === "coming") return 380;
    return 240;
  }, [step]);

  // Initial Geolocation
  useEffect(() => {
    const saved = loadSavedPlaces();
    setSavedPlaces(saved);
    try {
      const sc = JSON.parse(localStorage.getItem('taxiShortcuts') || '{}');
      setShortcuts({ home: sc.home || null, work: sc.work || null });
    } catch {}

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
      navigator.geolocation.getCurrentPosition(ok, fail, { enableHighAccuracy: true, timeout: 8000, maximumAge: 2000 });
    } else { fail(); }
    return () => { mounted = false; };
  }, []);

  // Sync Pickup/Dest with Map Center
  useEffect(() => {
    if ((step === "main" || step === "search") && pickupAddrFromCenter) {
      setPickup((p) => ({ ...p, address: pickupAddrFromCenter, latlng: centerLatLng }));
    }
  }, [pickupAddrFromCenter, step, centerLatLng]);

  useEffect(() => {
    if (step === "dest_map" && destAddrFromCenter) {
      setDest((d) => ({ ...d, address: destAddrFromCenter, latlng: centerLatLng }));
    }
  }, [destAddrFromCenter, step, centerLatLng]);

  useEffect(() => {
    if (!(step === "main" || step === "search")) return;
    if (!centerLatLng) return;
    setPickup((p) => ({ ...p, latlng: centerLatLng, address: pickupAddrFromCenter || p.address }));
  }, [pickupAddrFromCenter, centerLatLng, step]);

  useEffect(() => {
    if (step !== "dest_map") return;
    if (!centerLatLng) return;
    setDest((d) => ({ ...d, latlng: centerLatLng, address: destAddrFromCenter || d.address }));
  }, [destAddrFromCenter, centerLatLng, step]);

  // Route Calc
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (step !== "route" && step !== "coming") return;
      if (!pickup.latlng || !dest.latlng) { setRoute(null); return; }
      const pts = [pickup.latlng, ...waypoints.map((w) => w.latlng).filter(Boolean), dest.latlng];
      const r = await osrmRouteMulti(pts);
      if (!cancelled) setRoute(r);
    };
    run();
    return () => { cancelled = true; };
  }, [step, pickup.latlng, dest.latlng, waypoints]);

  // Restore Active Order
  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const saved = localStorage.getItem("activeOrderId");
        if (saved) setOrderId(saved);
        const res = await api.post("/api/order", { action: "active" });
        const o = res?.data || res;
        if (!mounted) return;
        if (o?.id) {
          setOrderId(String(o.id));
          localStorage.setItem("activeOrderId", String(o.id));
          setOrderStatus(o.status || o.order_status || "searching");
          setPickup((p) => ({ ...p, latlng: o.from_lat && o.from_lng ? [Number(o.from_lat), Number(o.from_lng)] : p.latlng, address: o.pickup_location || p.address }));
          if (o.to_lat && o.to_lng) { setDest({ latlng: [Number(o.to_lat), Number(o.to_lng)], address: o.dropoff_location || "" }); }
          if (["accepted", "coming", "arrived"].includes(o.status)) setStep("coming");
          else if (o.status === "searching") setStep("searching");
          else setStep("main");
        }
      } catch (e) {}
    };
    run();
    return () => { mounted = false; };
  }, []);

  // Order Polling
  useEffect(() => {
    if (!orderId) return;
    let timer = null; let alive = true;
    const tick = async () => {
      try {
        const res = await api.post("/api/order", { action: "get", order_id: orderId });
        if (!alive) return;
        const o = res?.data || res;
        const st = o?.status || o?.order_status;
        if (st && st !== orderStatus) {
          setOrderStatus(st);
          if (st === "accepted") speak("Haydovchi topildi");
          if (st === "arrived") speak("Haydovchi yetib keldi");
          if (st === "completed" || st === "done") {
            speak("Safar yakunlandi. Rahmat!");
            const drvId = o?.driver?.id || o?.driver_id || o?.assigned_driver_id || null;
            const clientId = o?.client_user_id || o?.user_id || null;
            setCompletedOrderForRating({ id: orderId, driver_id: drvId, client_user_id: clientId });
            setRatingVisible(true);
            const price = Number(o?.price || o?.amount || o?.priceUzs || 0);
            setEarnedBonus(Math.max(1, Math.floor(price * 0.01)));
          }
        }
        const drv = o?.driver || o?.assigned_driver || o?.assignedDriver;
        if (drv) {
          setAssignedDriver({
            first_name: drv.first_name || drv.name || "Haydovchi",
            avatar_url: drv.avatar_url || drv.avatar || "",
            car_model: drv.car_model || drv.car || "",
            plate: drv.plate || drv.car_plate || "",
            lat: Number(drv.lat ?? drv.driver_lat ?? drv.latitude),
            lng: Number(drv.lng ?? drv.driver_lng ?? drv.longitude),
            bearing: Number(drv.bearing ?? drv.heading ?? 0),
            rating: Number(drv.rating ?? 4.8),
            phone: drv.phone || "",
          });
        }
        if (assignedDriver?.lat && assignedDriver?.lng && pickup.latlng) {
          const d = haversineKm([assignedDriver.lat, assignedDriver.lng], pickup.latlng);
          setEtaMin(Math.max(1, Math.round(d * 3)));
        }
      } catch (e) {}
    };
    tick();
    const nextInterval = () => {
      if (step === "searching" || orderStatus === "searching") return 2000;
      if (["accepted", "coming", "arrived"].includes(orderStatus)) return 3500;
      if (["ontrip", "in_trip"].includes(orderStatus)) return 8000;
      return 4000;
    };
    let stopped = false;
    const loop = async () => {
      if (stopped) return;
      await tick();
      if (stopped) return;
      timer = setTimeout(loop, nextInterval());
    };
    loop();
    return () => { alive = false; stopped = true; if (timer) clearTimeout(timer); };
  }, [orderId, pickup.latlng, orderStatus, step]);

  // Fake nearby cars
  useEffect(() => {
    if (step !== "searching") return;
    if (!pickup.latlng) return;
    const baseLat = pickup.latlng[0];
    const baseLng = pickup.latlng[1];
    const cars = Array.from({ length: 6 }).map((_, i) => {
      const ang = (i / 6) * Math.PI * 2;
      const r = 0.006 + Math.random() * 0.01;
      return { id: "c" + i, lat: baseLat + Math.cos(ang) * r, lng: baseLng + Math.sin(ang) * r, bearing: Math.random() * 360 };
    });
    setNearCars(cars);
    setDispatchIdx(0);
    let t = setInterval(() => { setDispatchIdx((x) => (x + 1) % cars.length); }, 1800);
    return () => { if (t) clearInterval(t); };
  }, [step, pickup.latlng]);

  // Fly to driver
  useEffect(() => {
    if (step !== "coming") return;
    const map = mapRef.current;
    if (!map) return;
    if (assignedDriver?.lat && assignedDriver?.lng) {
      map.flyTo([assignedDriver.lat, assignedDriver.lng], clamp(map.getZoom() || 15, 14, 17), { duration: 0.6 });
    }
  }, [step, assignedDriver?.lat, assignedDriver?.lng]);

  // Scroll to tariff
  useEffect(() => {
    if (step === "route" && scrollTariffOnOpenRef.current) {
      scrollTariffOnOpenRef.current = false;
      setTimeout(() => { try { tariffSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); } catch {} }, 50);
    }
  }, [step]);

  return {
    mapRef, tariffSectionRef, scrollTariffOnOpenRef,
    darkMode, setDarkMode,
    step, setStep,
    userLoc, setUserLoc,
    pickup, setPickup,
    dest, setDest,
    waypoints, setWaypoints,
    addStopOpen, setAddStopOpen,
    centerLatLng, setCenterLatLng,
    isDraggingMap, setIsDraggingMap,
    searchOpen, setSearchOpen,
    pickupSearchText, setPickupSearchText,
    destSearchText, setDestSearchText,
    pickupResults, destResults,
    searchBusy,
    savedPlaces, setSavedPlaces,
    myAddressesV1, setMyAddressesV1, homeAddr, workAddr,
    route, tariff, setTariff, tariffs,
    orderId, setOrderId,
    orderStatus, setOrderStatus,
    assignedDriver, setAssignedDriver,
    ratingVisible, setRatingVisible,
    completedOrderForRating, setCompletedOrderForRating,
    bonusVisible, setBonusVisible,
    earnedBonus, setEarnedBonus,
    etaMin,
    podyezdOpen, setPodyezdOpen,
    shareOpen, setShareOpen,
    orderFor, setOrderFor,
    otherPhone, setOtherPhone,
    wishesOpen, setWishesOpen,
    wishes, setWishes,
    comment, setComment,
    scheduleOpen, setScheduleOpen,
    scheduledTime, setScheduledTime,
    shortcuts,
    nearCars, dispatchLine, dispatchIdx,
    pickupAddrFromCenter, destAddrFromCenter,
    requestLocateNow,
    setPickupFromSuggestion,
    setDestFromSuggestion,
    openDestinationSearch,
    choosePickup,
    chooseDestination,
    openPickupMapEdit,
    openDestMapEdit,
    openShareRide,
    addStopFromCenter,
    applyDestinationFromAddressString,
    handleOrderCreate,
    handleCancel,
    handlePickSaved,
    updateEntrance,
    changeDestination,
    shareLink,
    showSheet,
    mapTile,
    mapBottom,
    distanceKm, durationMin, totalPrice, MAX_KM
  };
}