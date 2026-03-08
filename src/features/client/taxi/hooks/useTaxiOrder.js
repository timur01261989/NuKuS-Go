import { translateClientPhrase } from "../../shared/i18n_clientLocalize";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { message } from "antd";
import api from "@/utils/apiHelper";
import { haversineKm } from "../../shared/geo/haversine";
import { nominatimReverse as _nominatimReverse } from "../../shared/geo/nominatim";

// Constants
export const MAX_KM = 50;
export const tileDay = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
export const tileNight = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

// Backward-compatible nominatim reverse geocoding
async function nominatimReverse(lat, lng, signal) {
  return _nominatimReverse(lat, lng, { signal });
}

// Nominatim search utility
export async function nominatimSearch(q, signal) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=7&addressdetails=1&q=${encodeURIComponent(
    q
  )}&countrycodes=uz`;
  try {
    const res = await fetch(url, { signal, headers: { "Accept-Language": "uz,ru,en" } });
    const data = await res.json();
    return (data || []).map((x) => ({
      id: x.place_id,
      label: x.display_name,
      lat: parseFloat(x.lat),
      lng: parseFloat(x.lon),
    }));
  } catch (e) {
    if (e?.name === "AbortError") return [];
    return [];
  }
}

// OSRM route calculation
export async function osrmRouteMulti(points) {
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
  // Fallback: straight line
  const from = points[0];
  const to = points[points.length - 1];
  return {
    coords: [from, to],
    distanceKm: haversineKm(from, to),
    durationMin: haversineKm(from, to) * 2,
  };
}

// Format money utility
export function money(n) {
  const x = Math.round(Number(n || 0));
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " so'm";
}

// Clamp utility
export function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
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

// Local storage utilities
export function loadMyAddressesV1() {
  try {
    const raw = localStorage.getItem("savedAddresses_v1");
    const arr = raw ? JSON.parse(raw) : [];
    if (Array.isArray(arr)) return arr;
  } catch {}
  return [];
}

export function loadSavedPlaces() {
  try {
    const raw = localStorage.getItem("client_saved_places");
    const arr = raw ? JSON.parse(raw) : [];
    if (Array.isArray(arr)) return arr;
  } catch {}
  return [];
}

export function savePlace(place) {
  const list = loadSavedPlaces();
  const exists = list.find((x) => x.id === place.id);
  const next = exists ? list.map((x) => (x.id === place.id ? place : x)) : [place, ...list].slice(0, 20);
  localStorage.setItem("client_saved_places", JSON.stringify(next));
  return next;
}

// Speech synthesis utility ("Alisa")
export function speak(text) {
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

// Main taxi order hook
export function useTaxiOrder() {
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
  const [orderId, setOrderId] = useState(null);
  const [orderStatus, setOrderStatus] = useState(null);
  const [assignedDriver, setAssignedDriver] = useState(null);
  const [ratingVisible, setRatingVisible] = useState(false);
  const [completedOrderForRating, setCompletedOrderForRating] = useState(null);
  const [bonusVisible, setBonusVisible] = useState(false);
  const [earnedBonus, setEarnedBonus] = useState(0);
  const [etaMin, setEtaMin] = useState(null);

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

  // Compute route when needed
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (step !== "route" && step !== "coming") return;
      if (!pickup.latlng || !dest.latlng) {
        setRoute(null);
        return;
      }
      const pts = [pickup.latlng, ...waypoints.map((w) => w.latlng).filter(Boolean), dest.latlng];
      const r = await osrmRouteMulti(pts);
      if (!cancelled) setRoute(r);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [step, pickup.latlng?.[0], pickup.latlng?.[1], dest.latlng?.[0], dest.latlng?.[1], waypoints.length]);

  // Search debouncing
  const pickupAbortRef = useRef(null);
  const destAbortRef = useRef(null);

  useEffect(() => {
    if (!searchOpen) return;
    const t = setTimeout(async () => {
      const q = pickupSearchText.trim();
      if (!q) {
        setPickupResults([]);
        return;
      }
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

  useEffect(() => {
    if (!searchOpen) return;
    const t = setTimeout(async () => {
      const q = destSearchText.trim();
      if (!q) {
        setDestResults([]);
        return;
      }
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
        const ll = [Number(first.lat), Number(first.lon)];
        const addr = first.display_name || q;
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

  // Order creation
  const handleOrderCreate = useCallback(async () => {
    if (!pickup.latlng) {
      message.error(cp("Yo'lovchini olish nuqtasi aniqlanmadi"));
      return;
    }

    if (dest.latlng) {
      const d = distanceKm || haversineKm(pickup.latlng, dest.latlng);
      if (d > MAX_KM) {
        message.error(`Masofa belgilangan me'yoridan ortiq (${MAX_KM} km)`);
        return;
      }
    }

    const hide = message.loading(cp("Buyurtma yuborilmoqda..."), 0);
    try {
      const payloadBase = {
        status: "searching",
        price: Math.round(totalPrice),
        // Stage-3: server pricing (final price computed server-side, client price is only an estimate)
        use_server_pricing: true,
        service_type: "taxi",
        tariff_id: tariff.id,
        pickup_location: pickup.address || cp("Yo'lovchini olish nuqtasi"),
        dropoff_location: dest.address || "",
        from_lat: pickup.latlng[0],
        from_lng: pickup.latlng[1],
        to_lat: dest.latlng ? dest.latlng[0] : null,
        to_lng: dest.latlng ? dest.latlng[1] : null,
        distance_km: dest.latlng ? (distanceKm || haversineKm(pickup.latlng, dest.latlng)) : 0,
        duration_min: dest.latlng ? Math.max(1, Math.round(((distanceKm || haversineKm(pickup.latlng, dest.latlng)) || 0) * 2)) : 0,
        waypoints: waypoints.map((w) => ({
          lat: w.latlng?.[0],
          lng: w.latlng?.[1],
          address: w.address || "",
        })),
        pickup_entrance: pickup.entrance || "",
        order_for: orderFor,
        other_phone: orderFor === "other" ? (otherPhone || "") : "",
        wishes: wishes,
        comment: comment || "",
        scheduled_time: scheduledTime,
      };

      const actions = ["create", "create_taxi", "create_city", "new"];
      let res = null;
      let lastErr = null;

      for (const action of actions) {
        try {
          res = await api.post("/api/order", { action, ...payloadBase });
          if (res?.data || res?.id || res?.orderId) break;
        } catch (e) {
          lastErr = e;
        }
      }

      const id = res?.data?.id || res?.id || res?.orderId;
      if (!id) throw lastErr || new Error(cp("Serverdan ID kelmadi"));

      setOrderId(String(id));
      localStorage.setItem("activeOrderId", String(id));
      setOrderStatus("searching");
      setStep("searching");
      speak(cp("Haydovchi qidirilmoqda"));
      message.success(cp("Buyurtma yuborildi"));
    } catch (e) {
      console.error("Order error:", e);
      message.error("Zakaz berishda xatolik: " + (e?.message || cp("Server bilan aloqa yo'q")));
    } finally {
      hide();
    }
  }, [pickup, dest, tariff, totalPrice, distanceKm, waypoints, orderFor, otherPhone, wishes, comment, scheduledTime]);

  // Cancel order
  const handleCancel = useCallback(async () => {
    if (!orderId) {
      setStep("main");
      setOrderStatus(null);
      return;
    }
    const hide = message.loading(cp("Bekor qilinmoqda..."), 0);
    try {
      await api.post("/api/order", { action: "cancel", order_id: orderId });
    } catch (e) {
      console.warn(e);
    } finally {
      hide();
      localStorage.removeItem("activeOrderId");
      setOrderId(null);
      setOrderStatus(null);
      setAssignedDriver(null);
      setNearCars([]);
      setDispatchLine(null);
      setStep("main");
      speak(cp("Safar bekor qilindi"));
    }
  }, [orderId]);

  // Polling active order on reload
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
          setPickup((p) => ({
            ...p,
            latlng: o.from_lat && o.from_lng ? [Number(o.from_lat), Number(o.from_lng)] : p.latlng,
            address: o.pickup_location || p.address,
          }));
          if (o.to_lat && o.to_lng) {
            setDest({ latlng: [Number(o.to_lat), Number(o.to_lng)], address: o.dropoff_location || "" });
          }
          if (o.status === "accepted" || o.status === "coming" || o.status === "arrived") {
            setStep("coming");
          } else if (o.status === "searching") {
            setStep("searching");
          } else {
            setStep("main");
          }
        }
      } catch (e) {
        // ignore
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, []);

  // Polling order status and driver info
  useEffect(() => {
    if (!orderId) return;

    let timer = null;
    let alive = true;

    const tick = async () => {
      try {
        const res = await api.post("/api/order", { action: "get", order_id: orderId });
        if (!alive) return;
        const o = res?.data || res;
        const st = o?.status || o?.order_status;
        if (st && st !== orderStatus) {
          setOrderStatus(st);
          if (st === "accepted") speak(cp("Haydovchi topildi"));
          if (st === "arrived") speak(cp("Haydovchi yetib keldi"));
          if (st === "completed" || st === "done") {
            speak(cp("Safar yakunlandi. Rahmat!"));
            const drvId = o?.driver?.id || o?.driver_id || o?.assigned_driver_id || null;
            const clientId = o?.client_id || o?.user_id || null;
            setCompletedOrderForRating({
              id: orderId,
              driver_id: drvId,
              client_id: clientId,
            });
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
      } catch (e) {
        // ignore
      }
    };

    tick();
    const nextInterval = () => {
      if (step === "searching" || orderStatus === "searching") return 2000;
      if (orderStatus === "accepted" || orderStatus === "coming" || orderStatus === "arrived") return 3500;
      if (orderStatus === "ontrip" || orderStatus === "in_trip") return 8000;
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

    return () => {
      alive = false;
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }, [orderId, pickup.latlng?.[0], pickup.latlng?.[1], orderStatus, step, assignedDriver]);

  // Simulate nearby cars during search
  useEffect(() => {
    if (step !== "searching") return;
    if (!pickup.latlng) return;

    const baseLat = pickup.latlng[0];
    const baseLng = pickup.latlng[1];

    const cars = Array.from({ length: 6 }).map((_, i) => {
      const ang = (i / 6) * Math.PI * 2;
      const r = 0.006 + Math.random() * 0.01;
      return {
        id: "c" + i,
        lat: baseLat + Math.cos(ang) * r,
        lng: baseLng + Math.sin(ang) * r,
        bearing: Math.random() * 360,
      };
    });

    setNearCars(cars);
    setDispatchIdx(0);

    let t = null;
    t = setInterval(() => {
      setDispatchIdx((x) => (x + 1) % cars.length);
    }, 1800);

    return () => {
      if (t) clearInterval(t);
    };
  }, [step, pickup.latlng]);

  useEffect(() => {
    if (step !== "searching") return;
    if (!pickup.latlng) return;
    if (!nearCars.length) return;
    const c = nearCars[dispatchIdx];
    if (!c) return;
    setDispatchLine([[c.lat, c.lng], pickup.latlng]);
  }, [step, dispatchIdx, nearCars, pickup.latlng]);

  // Sheet visibility
  const showSheet = useMemo(() => {
    if (step === "dest_map") return !isDraggingMap;
    return true;
  }, [step, isDraggingMap]);

  // Share link
  const shareLink = useMemo(() => {
    if (!orderId) return "";
    try {
      const origin = window.location.origin;
      return `${origin}/share/${orderId}`;
    } catch {
      return "";
    }
  }, [orderId]);

  // Map bottom position
  const mapBottom = useMemo(() => {
    if (step === "main") return 280;
    if (step === "search") return 340;
    if (step === "dest_map") return 240;
    if (step === "route") return 330;
    if (step === "searching") return 240;
    if (step === "coming") return 380;
    return 240;
  }, [step]);

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
    setPickupFromSuggestion,
    setDestFromSuggestion,
    applyDestinationFromAddressString,
    handleOrderCreate,
    handleCancel,
  };
}
