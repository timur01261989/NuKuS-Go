import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useClientText } from '../shared/i18n_clientLocalize';
import { osrmRoute } from "../shared/geo/osrm";
import { haversineKm } from "../shared/geo/haversine";
import { nominatimReverse as _nominatimReverse } from "../shared/geo/nominatim";


// UI components ONLY from antd
import {
  Avatar,
  Button,
  Card,
  Drawer,
  Input,
  List,
  Modal,
  Rate,
  Space,
  Spin,
  Tag,
  Typography,
  message,
} from "antd";

// Icons ONLY from @ant-design/icons
import {
  AimOutlined,
  ArrowLeftOutlined,
  CloseOutlined,
  EnvironmentOutlined,
  ExclamationCircleOutlined,
  FlagOutlined,
  SendOutlined,
  SwapOutlined,
  UserOutlined,
} from "@ant-design/icons";

import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import api from "@/utils/apiHelper";
import { supabase } from "@/lib/supabase";
import { playAliceVoice } from "@/utils/AudioPlayer";

// Backward-compatible signature (lat, lng, signal)
async function nominatimReverse(lat, lng, signal) {
  return _nominatimReverse(lat, lng, { signal });
}


const { Text, Title } = Typography;

/**
 * YANDEX-LIKE CITY TAXI ORDER CREATE (single-file)
 * - Map center pin with lift while dragging
 * - Pickup = center of map on main screen
 * - Destination can be typed or selected via map center
 * - Route + distance via OSRM (fallback: straight line)
 * - Tariffs + total price
 * - Create order even without destination
 * - Searching screen with waves + nearby cars simulation
 * - Accepted screen with driver tracking + chat + details
 */

/** ----------------------------- Helpers ----------------------------- */

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

function fmtMoney(n) {
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("ru-RU").format(Math.round(n));
}


// OSRM yo'nalish topa olmasa ham xato bermaslik uchun:


async function nominatimSearch(q, signal) {
  // countrycodes=uz natijalarni faqat O'zbekiston bilan cheklaydi
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

function randAround([lat, lng], meters = 900) {
  // very rough: 1 deg lat ~ 111km; 1 deg lng ~ 111km*cos(lat)
  const dLat = (meters / 111000) * (Math.random() - 0.5) * 2;
  const dLng = (meters / (111000 * Math.cos((lat * Math.PI) / 180))) * (Math.random() - 0.5) * 2;
  return [lat + dLat, lng + dLng];
}

/** ----------------------------- Leaflet icons ----------------------------- */

// Center pin (pickup vs dest) like Yandex: square yellow with person & pole
const svgPickupPin = `
<svg width="70" height="86" viewBox="0 0 70 86" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="12" y="6" width="46" height="46" rx="12" fill="#FFD400"/>
  <path d="M35 25c2.8 0 5-2.2 5-5s-2.2-5-5-5-5 2.2-5 5 2.2 5 5 5Z" fill="#111"/>
  <path d="M23 42c2.5-7.5 7.5-12 12-12s9.5 4.5 12 12" stroke="#111" stroke-width="4" stroke-linecap="round"/>
  <rect x="33" y="52" width="4" height="28" rx="2" fill="#111"/>
</svg>`;

const svgDestPin = `
<svg width="70" height="86" viewBox="0 0 70 86" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="12" y="6" width="46" height="46" rx="12" fill="#EDEDED"/>
  <path d="M25 34l10-12 10 12" stroke="#111" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M25 24l10 12 10-12" stroke="#111" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="33" y="52" width="4" height="28" rx="2" fill="#111"/>
  <circle cx="35" cy="80" r="6" fill="#fff" stroke="#111" stroke-width="4"/>
</svg>`;

const pickupMarkerIcon = L.divIcon({
  className: "",
  html: `<div class='yg-miniPin'>${svgPickupPin}</div>`,
  iconSize: [70, 86],
  iconAnchor: [35, 80],
});

const destMarkerIcon = L.divIcon({
  className: "",
  html: `<div class='yg-miniPin'>${svgDestPin}</div>`,
  iconSize: [70, 86],
  iconAnchor: [35, 80],
});

const carIcon = (bearing = 0) =>
  L.divIcon({
    className: "",
    html: `<div class='yg-car' style='transform: rotate(${bearing}deg);'>🚕</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

/** ----------------------------- Map helpers ----------------------------- */

function FlyTo({ center, zoom = 16 }) {
  const map = useMap();
  useEffect(() => {
    if (!center) return;
    map.flyTo(center, zoom, { duration: 0.7 });
  }, [map, center, zoom]);
  return null;
}

function CenterTracker({ enabled, onCenter, setIsDragging }) {
  const map = useMap();

  useEffect(() => {
    if (!enabled) return;

    const onMoveStart = () => setIsDragging(true);
    const onMoveEnd = () => {
      setIsDragging(false);
      const c = map.getCenter();
      onCenter([c.lat, c.lng]);
    };

    map.on("movestart", onMoveStart);
    map.on("moveend", onMoveEnd);

    return () => {
      map.off("movestart", onMoveStart);
      map.off("moveend", onMoveEnd);
    };
  }, [enabled, map, onCenter, setIsDragging]);

  return null;
}

function FitRoute({ from, to, bottomPad = 320 }) {
  const map = useMap();
  useEffect(() => {
    if (!from || !to) return;
    try {
      const b = L.latLngBounds(from, to);
      map.fitBounds(b, {
        paddingTopLeft: [50, 50],
        paddingBottomRight: [50, bottomPad],
      });
    } catch {
      // ignore
    }
  }, [map, from, to, bottomPad]);
  return null;
}

/** ----------------------------- Tariffs ----------------------------- */

const TARIFFS = [
  { id: "start", name: "Start", base: 6500, perKm: 1500, etaMin: 2 },
  { id: "comfort", name: "Komfort", base: 7500, perKm: 1800, etaMin: 4 },
  { id: "econom", name: "Shahar bo'yicha", base: 4500, perKm: 1300, etaMin: 6 },
];

/** ----------------------------- Main Component ----------------------------- */

export default function ClientOrderCreateYandexStyle() {
  // --- core states ---
  const [stage, setStage] = useState("home");
  // stages:
  // home -> dest_sheet -> dest_map -> confirm -> searching -> accepted

  const [drawerOpen, setDrawerOpen] = useState(true);
  const [destSheetOpen, setDestSheetOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [ratingOpen, setRatingOpen] = useState(false);

  const [userLoc, setUserLoc] = useState(null);
  const [pickup, setPickup] = useState({ latlng: null, address: "" });
  const [dest, setDest] = useState({ latlng: null, address: "" });

  const [selecting, setSelecting] = useState(null); // null | 'pickup' | 'dest'
  const [isDragging, setIsDragging] = useState(false);

  const [tariff, setTariff] = useState(TARIFFS[0]);
  const [routeCoords, setRouteCoords] = useState([]);
  const [distanceKm, setDistanceKm] = useState(null);
  const [durationMin, setDurationMin] = useState(null);
  const approxDistanceKm = useMemo(() => {
    if (pickup.latlng && dest.latlng) return haversineKm(pickup.latlng, dest.latlng);
    return null;
  }, [pickup.latlng, dest.latlng]);

  const totalPrice = useMemo(() => {
    // If destination not selected yet, show base price only.
    const km = distanceKm ?? approxDistanceKm;
    if (!km || !Number.isFinite(km)) return tariff.base;
    return tariff.base + km * tariff.perKm;
  }, [tariff, distanceKm, approxDistanceKm]);

  // --- search input / history ---
  const [destQuery, setDestQuery] = useState("");
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("taxiHistory") || "[]");
    } catch {
      return [];
    }
  });

  // --- order states ---
  const [orderId, setOrderId] = useState(() => localStorage.getItem("activeOrderId") || "");
  const [orderStatus, setOrderStatus] = useState(null); // searching | accepted | arrived | completed | canceled
  const [assignedDriver, setAssignedDriver] = useState(null);

  // --- searching animation / cars ---
  const [nearCars, setNearCars] = useState([]);
  const [activeCarIdx, setActiveCarIdx] = useState(0);

  // --- chat state ---
  const [messagesState, setMessagesState] = useState([]);
  const [msgText, setMsgText] = useState("");
  const chatScrollRef = useRef(null);

  // --- refs ---
  const mapRef = useRef(null);
  const reverseAbortRef = useRef(null);
  const searchAbortRef = useRef(null);
  const pollRef = useRef(null);

  // Dispatch safety: avoid spamming /api/dispatch and avoid overlapping requests
  const dispatchInFlightRef = useRef(false);
  const lastDispatchAttemptRef = useRef(0);

  const isNight = useMemo(() => document.body.classList.contains("night-mode-active"), []);

  /** ----------------------------- Location init ----------------------------- */
  useEffect(() => {
    let alive = true;
    const fallback = [42.4602, 59.6176]; // Nukus-ish (fallback)

    const onOk = (pos) => {
      if (!alive) return;
      const c = [pos.coords.latitude, pos.coords.longitude];
      setUserLoc(c);
      setPickup((p) => ({ ...p, latlng: c }));
      // reverse pickup
      (async () => {
        const addr = await nominatimReverse(c[0], c[1]);
        if (addr && alive) setPickup({ latlng: c, address: addr });
      })();
    };

    const onErr = async () => {
      if (!alive) return;
      setUserLoc(fallback);
      setPickup({ latlng: fallback, address: "" });
      const addr = await nominatimReverse(fallback[0], fallback[1]);
      if (addr && alive) setPickup({ latlng: fallback, address: addr });
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(onOk, onErr, {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 4000,
      });
    } else {
      onErr();
    }

    return () => {
      alive = false;
    };
  }, []);

  /** ----------------------------- Active order check (server-side) ----------------------------- */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await api.post("/api/order", { action: "active" });
        const active = res?.data || res;
        if (!alive) return;
        if (active?.id) {
          setOrderId(String(active.id));
          localStorage.setItem("activeOrderId", String(active.id));
          setOrderStatus(active.status || "searching");
          setAssignedDriver(active.assigned_driver || active.assignedDriver || null);
          // load pickup/dest if server has it
          if (active.from_lat && active.from_lng) {
            setPickup((p) => ({ ...p, latlng: [active.from_lat, active.from_lng], address: active.pickup_location || p.address }));
          }
          if (active.to_lat && active.to_lng) {
            setDest((d) => ({ ...d, latlng: [active.to_lat, active.to_lng], address: active.dropoff_location || d.address }));
          }
          // switch stage
          if ((active.status || "").toLowerCase() === "accepted") {
            setStage("accepted");
            setDrawerOpen(false);
          } else {
            setStage("searching");
            setDrawerOpen(false);
          }
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  /** ----------------------------- Suggest / History ----------------------------- */
  useEffect(() => {
    if (!destSheetOpen) return;
    const q = destQuery.trim();
    if (!q) {
      setDestSuggestions([]);
      return;
    }

    if (searchAbortRef.current) searchAbortRef.current.abort();
    const ac = new AbortController();
    searchAbortRef.current = ac;

    const t = setTimeout(async () => {
      const list = await nominatimSearch(q, ac.signal);
      setDestSuggestions(list);
    }, 260);

    return () => {
      clearTimeout(t);
      ac.abort();
    };
  }, [destQuery, destSheetOpen]);

  const saveHistory = useCallback(
    (item) => {
      const next = [item, ...history.filter((x) => x.id !== item.id)].slice(0, 10);
      setHistory(next);
      localStorage.setItem("taxiHistory", JSON.stringify(next));
    },
    [history]
  );

  /** ----------------------------- Center picked (reverse geocode with debounce/abort) ----------------------------- */
  const handleCenterPicked = useCallback(
    async (latlng) => {
      if (!selecting) return;

      // update instantly
      if (selecting === "pickup") {
        setPickup((p) => ({ ...p, latlng }));
      } else {
        setDest((d) => ({ ...d, latlng }));
      }

      // Debounced reverse
      if (reverseAbortRef.current) reverseAbortRef.current.abort();
      const ac = new AbortController();
      reverseAbortRef.current = ac;

      const addr = await nominatimReverse(latlng[0], latlng[1], ac.signal);
      if (!addr) return;

      if (selecting === "pickup") {
        setPickup({ latlng, address: addr });
      } else {
        setDest({ latlng, address: addr });
      }
    },
    [selecting]
  );

  /** ----------------------------- Route build (when both points selected) ----------------------------- */
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!pickup.latlng || !dest.latlng) {
        setRouteCoords([]);
        setDistanceKm(null);
        setDurationMin(null);
        return;
      }
      const r = await osrmRoute(pickup.latlng, dest.latlng);
      if (!alive) return;
      setRouteCoords(r.coords || []);
      setDistanceKm(r.distanceKm ?? null);
      setDurationMin(r.durationMin ?? null);
    })();
    return () => {
      alive = false;
    };
  }, [pickup.latlng, dest.latlng]);

  /** ----------------------------- Searching (cars simulation & active line) ----------------------------- */
  useEffect(() => {
    if (stage !== "searching" || !pickup.latlng) return;

    // create cars around pickup
    const cars = new Array(6).fill(0).map(() => {
      const pos = randAround(pickup.latlng, 2200);
      const bearing = Math.floor(Math.random() * 360);
      return { id: crypto.randomUUID?.() || String(Math.random()), pos, bearing };
    });
    setNearCars(cars);
    setActiveCarIdx(0);

    const timer = setInterval(() => {
      setActiveCarIdx((i) => (i + 1) % Math.max(1, cars.length));
    }, 2200);

    return () => clearInterval(timer);
  }, [stage, pickup.latlng]);

  /** ----------------------------- Poll order status ----------------------------- */
  const startPolling = useCallback(
    (id) => {
      if (!id) return;
      if (pollRef.current) clearInterval(pollRef.current);

      pollRef.current = setInterval(async () => {
        try {
          const res = await api.post("/api/order", { action: "status", id });
          const st = (res?.data?.status || res?.status || "").toLowerCase();
          if (!st) return;

          setOrderStatus(st);
          const driver = res?.data?.assigned_driver || res?.assigned_driver || res?.assignedDriver || null;
          if (driver) setAssignedDriver(driver);

// Retry dispatch while still searching (prevents "stuck" orders when driver doesn't respond)
if (st === "searching" && !driver) {
  const nowTs = Date.now();
  if (!dispatchInFlightRef.current && nowTs - lastDispatchAttemptRef.current >= 6000) {
    dispatchInFlightRef.current = true;
    lastDispatchAttemptRef.current = nowTs;
    try {
      await api.post("/api/dispatch", { order_id: String(id) });
    } catch {
      // ignore dispatch retry errors (next tick will retry)
    } finally {
      dispatchInFlightRef.current = false;
    }
  }
}

          if (st === "accepted" || st === "arrived") {
            setStage("accepted");
          }
          if (st === "completed") {
            setStage("home");
            setDrawerOpen(true);
            setDestSheetOpen(false);
            setDetailsOpen(false);
            setChatOpen(false);
            setOrderId("");
            setOrderStatus(null);
            setAssignedDriver(null);
            localStorage.removeItem("activeOrderId");
            setRatingOpen(true);
          }
          if (st === "canceled") {
            setStage("home");
            setDrawerOpen(true);
            setDestSheetOpen(false);
            setDetailsOpen(false);
            setChatOpen(false);
            setOrderId("");
            setOrderStatus(null);
            setAssignedDriver(null);
            localStorage.removeItem("activeOrderId");
            message.info("Buyurtma bekor qilindi");
          }
        } catch {
          // ignore
        }
      }, 2500);
    },
    [setOrderStatus]
  );

  useEffect(() => {
    if (!orderId) return;
    startPolling(orderId);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [orderId, startPolling]);

  /** ----------------------------- Track driver on map ----------------------------- */
  // If assignedDriver has lat/lng -> fly map to driver when accepted
  useEffect(() => {
    if (stage !== "accepted") return;
    const lat = assignedDriver?.lat ?? assignedDriver?.driver_lat ?? assignedDriver?.current_lat;
    const lng = assignedDriver?.lng ?? assignedDriver?.driver_lng ?? assignedDriver?.current_lng;
    if (!lat || !lng) return;
    const m = mapRef.current;
    if (!m) return;
    m.flyTo([lat, lng], Math.max(15, m.getZoom() || 16), { duration: 0.6 });
  }, [stage, assignedDriver]);

  /** ----------------------------- Chat realtime logic ----------------------------- */
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      chatScrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 80);
  }, []);

  useEffect(() => {
    if (!chatOpen || !orderId) return;

    // 1) history
    const fetchHistory = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: true });

      if (!error && data) {
        setMessagesState(data);
        scrollToBottom();
      }
    };

    fetchHistory();

    // 2) realtime
    const channel = supabase
      .channel(`chat_room:${orderId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `order_id=eq.${orderId}` },
        (payload) => {
          setMessagesState((prev) => [...prev, payload.new]);
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatOpen, orderId, scrollToBottom]);

  const handleSendMessage = useCallback(async () => {
    if (!msgText.trim() || !orderId) return;
    const textToSend = msgText.trim();
    setMsgText("");

    await supabase.from("messages").insert([
      {
        order_id: orderId,
        sender_role: "client",
        content: textToSend,
        created_at: new Date().toISOString(),
      },
    ]);
  }, [msgText, orderId]);

  /** ----------------------------- Actions ----------------------------- */

  const openDestSheet = useCallback(() => {
    setDestSheetOpen(true);
    setStage("dest_sheet");
    setDrawerOpen(false);
  }, []);

  const goBackToHome = useCallback(() => {
    setStage("home");
    setDestSheetOpen(false);
    setDetailsOpen(false);
    setChatOpen(false);
    setDrawerOpen(true);
    setSelecting(null);
  }, []);

  const startDestMapPick = useCallback(() => {
    // open destination picker on map center
    setStage("dest_map");
    setDestSheetOpen(false);
    setDrawerOpen(false);
    setSelecting("dest");
    // move center to current map or pickup
    const m = mapRef.current;
    if (m) {
      const c = m.getCenter();
      handleCenterPicked([c.lat, c.lng]);
    } else if (pickup.latlng) {
      handleCenterPicked(pickup.latlng);
    }
  }, [handleCenterPicked, pickup.latlng]);

  const confirmDest = useCallback(() => {
    // after dest map pick -> go to confirm stage
    setSelecting(null);
    setStage("confirm");
    setDrawerOpen(true);
  }, []);

  // handleOrder funksiyasini barqaror qilish:
  const handleOrder = useCallback(async () => {
    if (!pickup.latlng) {
      message.error(cp("Manzil topilmadi"));
      return;
    }

    const hide = message.loading("Buyurtma yuborilmoqda...", 0);
    try {
      const payload = {
        action: "create",
        status: "searching",
        price: Math.round(totalPrice),
        // Stage-3: server pricing (final price computed server-side, client price is only an estimate)
        use_server_pricing: true,
        service_type: "taxi",
        tariff_id: tariff.id,
        pickup_location: pickup.address || "Pickup",
        dropoff_location: dest.address || null,
        from_lat: pickup.latlng[0],
        from_lng: pickup.latlng[1],
        to_lat: dest.latlng ? dest.latlng[0] : null,
        to_lng: dest.latlng ? dest.latlng[1] : null,
        distance_km: distanceKm || approxDistanceKm || 0,
        duration_min: durationMin ? Math.round(durationMin) : (distanceKm || approxDistanceKm) ? Math.max(1, Math.round(((distanceKm || approxDistanceKm) || 0) * 2)) : 0,
      };

      const res = await api.post("/api/order", payload);

      const id = res?.data?.id || res?.id || res?.orderId;
      if (!id) throw new Error("Serverdan ID kelmadi");

      setOrderId(String(id));
      localStorage.setItem("activeOrderId", String(id));
      setOrderStatus("searching");

      setStage("searching");
      setDrawerOpen(false);
      setDestSheetOpen(false);
      playAliceVoice?.("order_sent");

      message.success("Buyurtma yuborildi");

      // Immediately request dispatch
      try {
        const d = await api.post("/api/dispatch", { order_id: String(id) });
        if (d?.error) throw new Error(d.error);
      } catch (e) {
        console.error("Dispatch error:", e);
        message.error(cp("Qidirishda xatolik"));
      }
    } catch (e) {
      console.error("Order error:", e);
      message.error("Zakaz berishda xatolik: " + (e?.message || "Server bilan aloqa yo'q"));
    } finally {
      hide();
    }
  }, [pickup, dest, tariff, totalPrice, distanceKm, approxDistanceKm]);

  const handleCancel = useCallback(async () => {
    if (!orderId) {
      goBackToHome();
      return;
    }

    const hide = message.loading("Bekor qilinmoqda...", 0);
    try {
      await api.post("/api/order", { action: "cancel", id: orderId });
    } catch {
      // ignore
    } finally {
      hide();
      setOrderId("");
      setOrderStatus(null);
      setAssignedDriver(null);
      localStorage.removeItem("activeOrderId");
      setStage("home");
      setDrawerOpen(true);
      setDestSheetOpen(false);
      setDetailsOpen(false);
      setChatOpen(false);
      message.success("Safar bekor qilindi");
    }
  }, [orderId, goBackToHome]);

  /** ----------------------------- Dest selection by list ----------------------------- */
  const selectDestFromSuggestion = useCallback(
    async (sug) => {
      setDest({ latlng: [sug.lat, sug.lng], address: sug.label });
      saveHistory(sug);
      setDestQuery("");
      setDestSuggestions([]);
      setDestSheetOpen(false);
      setSelecting(null);
      setStage("confirm");
      setDrawerOpen(true);

      // Fit map to show route
      setTimeout(() => {
        const m = mapRef.current;
        if (!m) return;
        if (pickup.latlng && [sug.lat, sug.lng]) {
          try {
            m.fitBounds(L.latLngBounds(pickup.latlng, [sug.lat, sug.lng]), {
              paddingTopLeft: [50, 50],
              paddingBottomRight: [50, 350],
            });
          } catch {
            // ignore
          }
        }
      }, 250);
    },
    [saveHistory, pickup.latlng]
  );

  /** ----------------------------- UI derived values ----------------------------- */

  const pickupTitle = pickup.address ? pickup.address.split(",")[0] : cp("Manzilingiz aniqlanmoqda...");
  const destTitle = dest.address ? dest.address.split(",")[0] : "Qayerga borasiz?";

  const bottomPad = stage === "home" ? 280 : 330;

  // Map center for initial view
  const mapCenter = useMemo(() => {
    return userLoc || pickup.latlng || [42.4602, 59.6176];
  }, [userLoc, pickup.latlng]);

  // route stroke (solid green)
  const routeStroke = {
    color: "#22C55E",
    weight: 8,
    opacity: 0.95,
  };

  // active driver coords if available
  const driverLatLng = useMemo(() => {
    const lat = assignedDriver?.lat ?? assignedDriver?.driver_lat ?? assignedDriver?.current_lat;
    const lng = assignedDriver?.lng ?? assignedDriver?.driver_lng ?? assignedDriver?.current_lng;
    if (lat && lng) return [Number(lat), Number(lng)];
    return null;
  }, [assignedDriver]);

  /** ----------------------------- Render ----------------------------- */

  return (
    <div className="yg-root">
      {/* MAP */}
      <div className="yg-mapWrap">
        <MapContainer
          center={mapCenter}
          zoom={15}
          style={{ height: "100%", width: "100%" }}
          whenCreated={(map) => {
            mapRef.current = map;
          }}
          zoomControl={false}
        >
          <TileLayer
            url={
              isNight
                ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            }
          />

          {/* Fly to user location first */}
          <FlyTo center={mapCenter} zoom={15} />

          {/* Track center only when selecting */}
          <CenterTracker enabled={!!selecting} onCenter={handleCenterPicked} setIsDragging={setIsDragging} />

          {/* Fit route on confirm */}
          {stage === "confirm" && pickup.latlng && dest.latlng && <FitRoute from={pickup.latlng} to={dest.latlng} bottomPad={bottomPad} />}

          {/* Markers */}
          {pickup.latlng && stage !== "home" && stage !== "dest_map" && (
            <Marker position={pickup.latlng} icon={pickupMarkerIcon} />
          )}

          {dest.latlng && stage === "confirm" && <Marker position={dest.latlng} icon={destMarkerIcon} />}

          {/* Route */}
          {routeCoords.length >= 2 && stage === "confirm" && <Polyline positions={routeCoords} pathOptions={routeStroke} />}

          {/* Searching cars */}
          {stage === "searching" && nearCars.map((c) => <Marker key={c.id} position={c.pos} icon={carIcon(c.bearing)} />)}

          {/* Driver marker + line in accepted */}
          {stage === "accepted" && driverLatLng && (
            <>
              <Marker position={driverLatLng} icon={carIcon(assignedDriver?.bearing || 0)} />
              {pickup.latlng && <Polyline positions={[driverLatLng, pickup.latlng]} pathOptions={{ color: "#22C55E", weight: 7, opacity: 0.9 }} />}
            </>
          )}
        </MapContainer>

        {/* Center Pin overlay (home + dest map) */}
        {(stage === "home" || stage === "dest_map") && (
          <div className={`yg-centerpin ${isDragging ? "dragging" : ""}`} aria-hidden>
            <div
              style={{ position: "relative", width: 70, height: 86 }}
              dangerouslySetInnerHTML={{ __html: stage === "dest_map" ? svgDestPin : svgPickupPin }}
            />
            <div className="yg-pinlabel">{stage === "dest_map" ? cp("Yakuniy nuqta") : cp("Qayerdan ketasiz?")}</div>
          </div>
        )}

        {/* Locate me button */}
        <div className="yg-locate">
          <Button
            shape="circle"
            size="large"
            icon={<AimOutlined style={{ fontSize: 22 }} />}
            onClick={() => {
              const m = mapRef.current;
              if (m && userLoc) m.flyTo(userLoc, 16);
            }}
          />
        </div>

        {/* Back button (like screenshot) */}
        {(stage !== "home" && stage !== "searching" && stage !== "accepted") && (
          <div className="yg-back">
            <Button shape="circle" icon={<ArrowLeftOutlined />} onClick={goBackToHome} />
          </div>
        )}

        {/* Searching waves */}
        {stage === "searching" && (
          <div className="yg-waves">
            <div className="yg-wave" />
            <div className="yg-wave" />
            <div className="yg-wave" />
          </div>
        )}

        {/* Searching active line to a car */}
        {stage === "searching" && pickup.latlng && nearCars[activeCarIdx] && (
          <svg className="yg-aimLine" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* purely decorative - line is done by CSS gradient */}
          </svg>
        )}
      </div>

      {/* HOME / CONFIRM bottom sheet (Drawer) */}
      <Drawer
        placement="bottom"
        open={drawerOpen}
        closable={false}
        height={stage === "confirm" ? 380 : 300}
        bodyStyle={{ padding: 0, borderTopLeftRadius: 22, borderTopRightRadius: 22, overflow: "hidden" }}
        mask={false}
        onClose={() => setDrawerOpen(false)}
      >
        {stage === "home" && (
          <div className="yg-sheet">
            <div className="yg-sheetHead">
              <div className="yg-logo" />
              <Title level={2} style={{ margin: 0 }}>
                Taksi
              </Title>
            </div>

            <div className="yg-bigRow" onClick={openDestSheet} role="button" tabIndex={0}>
              <div className="yg-bigRowText">Qayerga borasiz?</div>
              <div className="yg-bigRowArrow">›</div>
            </div>

            {/* history list */}
            <div className="yg-history">
              <List
                dataSource={history}
                locale={{ emptyText: "" }}
                renderItem={(it) => (
                  <List.Item className="yg-hItem" onClick={() => selectDestFromSuggestion(it)}>
                    <div className="yg-hIcon">
                      <EnvironmentOutlined />
                    </div>
                    <div className="yg-hText">
                      <div className="yg-hTitle">{String(it.label || "").split(",")[0]}</div>
                      <div className="yg-hSub">{it.label}</div>
                    </div>
                  </List.Item>
                )}
              />
            </div>

            {/* Call taxi without destination */}
            <div className="yg-homeActions">
              <Button
                type="primary"
                className="yg-orderBtn"
                onClick={() => {
                  // allow without destination
                  setStage("confirm");
                  setDrawerOpen(true);
                }}
              >
                Buyurtma berish
              </Button>
              <Button className="yg-smallBtn" icon={<SwapOutlined />} />
            </div>
          </div>
        )}

        {stage === "confirm" && (
          <div className="yg-sheet">
            <div className="yg-confirmHeader">
              <div className="yg-confirmTitle">{pickupTitle}</div>
              <Button
                className="yg-pill"
                onClick={() => {
                  // pickup change by map
                  setSelecting("pickup");
                  setStage("home");
                  setDrawerOpen(false);
                }}
              >
                Podyez
              </Button>
            </div>

            <div className="yg-confirmHeader" style={{ marginTop: 8 }}>
              <div className="yg-confirmTitle">
                {dest.address ? destTitle : <span style={{ opacity: 0.65 }}>Qayerga borasiz?</span>}
              </div>
              <Button className="yg-pill" onClick={openDestSheet}>
                {dest.address ? "O'zgartirish" : "Xarita"}
              </Button>
            </div>

            <div className="yg-routeInfo">
              <div className="yg-routePill">
                <FlagOutlined />
                <span>{durationMin ? `${Math.round(durationMin)} daq` : distanceKm ? `${Math.round(distanceKm * 2)} daq` : "—"}</span>
              </div>
              <div className="yg-routePill" style={{ fontWeight: 800 }}>
                {fmtMoney(totalPrice)} {cp("so'm")}
              </div>
            </div>

            <div className="yg-tabs">
              <div className="yg-tab">Navigator</div>
              <div className="yg-tab">Transport</div>
              <div className="yg-tab yg-tabActive">Taksi va Yetkazish</div>
            </div>

            <div className="yg-tariffs">
              {TARIFFS.map((t) => (
                <div
                  key={t.id}
                  className={`yg-tariff ${tariff.id === t.id ? "active" : ""}`}
                  onClick={() => setTariff(t)}
                >
                  <div className="yg-tariffEta">{t.etaMin} daq</div>
                  <div className="yg-tariffName">{t.name}</div>
                  <div className="yg-tariffPrice">
                    {fmtMoney(t.base + ((distanceKm ?? approxDistanceKm) || 0) * t.perKm)} {cp("so'm")}
                  </div>
                </div>
              ))}
            </div>

            <div className="yg-confirmActions">
              <Button type="primary" className="yg-orderBtnYellow" onClick={handleOrder}>
                Buyurtma berish
              </Button>
              <Button className="yg-smallBtn" icon={<SwapOutlined />} />
            </div>
          </div>
        )}
      </Drawer>

      {/* DESTINATION SHEET */}
      <Drawer
        placement="bottom"
        open={destSheetOpen}
        closable={false}
        height={560}
        bodyStyle={{ padding: 0, borderTopLeftRadius: 22, borderTopRightRadius: 22, overflow: "hidden" }}
        mask={false}
        onClose={() => setDestSheetOpen(false)}
      >
        <div className="yg-destSheet">
          <div className="yg-topRows">
            <div className="yg-topRow">
              <div className="yg-topIcon">{/* pickup icon */}</div>
              <div className="yg-topText">
                <div className="yg-topLabel">Yo'lovchini olish nuqtasi</div>
                <div className="yg-topValue">{pickupTitle}</div>
              </div>
            </div>
            <div className="yg-topRow">
              <div className="yg-topIcon">{/* dest icon */}</div>
              <div className="yg-topText" style={{ flex: 1 }}>
                <div className="yg-topLabel">Yakuniy manzil</div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <Input
                    value={destQuery}
                    onChange={(e) => setDestQuery(e.target.value)}
                    placeholder="Qayerga borasiz?"
                    style={{ borderRadius: 14, height: 42 }}
                    prefix={<EnvironmentOutlined />}
                  />
                  <Button className="yg-mapBtn" onClick={startDestMapPick}>
                    Xarita
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="yg-suggestions">
            {/* Suggestions first, then history */}
            <List
              dataSource={destSuggestions.length ? destSuggestions : history}
              locale={{ emptyText: "" }}
              renderItem={(it) => (
                <List.Item className="yg-sItem" onClick={() => selectDestFromSuggestion(it)}>
                  <div className="yg-hIcon">
                    <EnvironmentOutlined />
                  </div>
                  <div className="yg-hText">
                    <div className="yg-hTitle">{String(it.label || "").split(",")[0]}</div>
                    <div className="yg-hSub">{it.label}</div>
                  </div>
                </List.Item>
              )}
            />
          </div>

          <div className="yg-sheetFooter">
            <Button icon={<ArrowLeftOutlined />} onClick={goBackToHome}>
              Orqaga
            </Button>
          </div>
        </div>
      </Drawer>

      {/* DESTINATION MAP PICK SMALL PRICE CARD */}
      {stage === "dest_map" && (
        <div className="yg-miniCard">
          <div className="yg-miniPrice">
            <div className="yg-miniTime">{durationMin ? `${Math.round(durationMin)} daq` : "—"}</div>
            <div className="yg-miniMoney">{fmtMoney(totalPrice)} {cp("so'm")}</div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            <Button danger icon={<CloseOutlined />} onClick={goBackToHome}>
              Bekor
            </Button>
            <Button type="primary" onClick={confirmDest}>
              Tayyor
            </Button>
          </div>
        </div>
      )}

      {/* SEARCHING BOTTOM PANEL */}
      {stage === "searching" && (
        <div className="yg-searchPanel">
          <div className="yg-searchTitle">Yaqin-atrofda mos mashina qidiryapmiz</div>
          <div className="yg-searchSub">Moslarini qidiryapmiz</div>
          <div className="yg-searchBtns">
            <Button className="yg-grayBtn" icon={<CloseOutlined />} onClick={handleCancel}>
              Safarni bekor qilish
            </Button>
            <Button className="yg-grayBtn" icon={<ExclamationCircleOutlined />} onClick={() => message.info("Tafsilotlar keyin")}
            >
              Tafsilotlar
            </Button>
          </div>
        </div>
      )}

      {/* ACCEPTED BOTTOM PANEL */}
      {stage === "accepted" && (
        <div className="yg-accepted">
          <div className="yg-notif">
            <div className="yg-notifLeft">
              <div className="yg-go">Go</div>
              <div>
                <div className="yg-notifTop">Yaqinda keladi</div>
                <div className="yg-notifSub">1–3 daqiqadan keyin haydovchi yetib boradi</div>
              </div>
            </div>
            <Button shape="circle" icon={<SwapOutlined />} onClick={() => setDetailsOpen(true)} />
          </div>

          <div className="yg-eta">~{assignedDriver?.eta_min || 2} daq va keladi</div>

          <div className="yg-driverCard">
            <div className="yg-driverRow">
              <div className="yg-driverLeft">
                <div className="yg-driverTitle">Haydovchi ★{assignedDriver?.rating || 4.83}</div>
                <div className="yg-driverSub">{assignedDriver?.car_model || "Oq Chevrolet Cobalt"}</div>
                <div className="yg-plate">{assignedDriver?.car_plate || "95S703RA"}</div>
              </div>
              <div className="yg-driverRight">
                <Avatar size={64} src={assignedDriver?.avatar_url} icon={<UserOutlined />} />
              </div>
            </div>

            <div className="yg-driverActions">
              <Button className="yg-actionBtn" onClick={() => setChatOpen(true)}>
                Aloqa
              </Button>
              <Button className="yg-actionBtn" onClick={() => message.info("Xavfsizlik")}
              >
                Xavfsizlik
              </Button>
              <Button className="yg-actionBtn" onClick={() => message.info("Ulashish")}
              >
                Ulashish
              </Button>
            </div>

            <div className="yg-pickRow" onClick={() => setDetailsOpen(true)}>
              <div className="yg-pickLabel">Mijozni olish ~{assignedDriver?.pickup_eta || "23:13"}</div>
              <div className="yg-pickAddr">{pickupTitle}</div>
            </div>
          </div>

          <div className="yg-detailsHint" onClick={() => setDetailsOpen(true)}>
            <span>Yana ko'rsatish</span>
          </div>
        </div>
      )}

      {/* DETAILS (like screenshot #8) */}
      <Drawer
        placement="bottom"
        open={detailsOpen}
        closable={false}
        height={560}
        bodyStyle={{ padding: 0, borderTopLeftRadius: 22, borderTopRightRadius: 22, overflow: "hidden" }}
        mask={false}
        onClose={() => setDetailsOpen(false)}
      >
        <div className="yg-details">
          <div className="yg-detailsTop">
            <div className="yg-detailsHeader">
              <div className="yg-go">Go</div>
              <div className="yg-detailsHeaderText">Yandex Go • Hozir</div>
            </div>
            <Button shape="circle" icon={<CloseOutlined />} onClick={() => setDetailsOpen(false)} />
          </div>

          <div className="yg-detailBtns">
            <Button className="yg-actionBtn" onClick={() => setChatOpen(true)}>
              Aloqa
            </Button>
            <Button className="yg-actionBtn" onClick={() => message.info("Xavfsizlik")}
            >
              Xavfsizlik
            </Button>
            <Button className="yg-actionBtn" onClick={() => message.info("Ulashish")}
            >
              Ulashish
            </Button>
          </div>

          <div className="yg-detailsList">
            <div className="yg-lineItem">
              <div className="yg-lineIcon">🙋</div>
              <div className="yg-lineText">
                <div className="yg-lineLabel">Mijozni olish</div>
                <div className="yg-lineValue">{pickupTitle}</div>
              </div>
              <div className="yg-lineArrow">›</div>
            </div>

            <div className="yg-lineItem">
              <div className="yg-lineIcon">🏁</div>
              <div className="yg-lineText">
                <div className="yg-lineLabel">Yetib kelish</div>
                <div className="yg-lineValue">{destTitle}</div>
              </div>
              <div className="yg-lineArrow">›</div>
            </div>

            <div className="yg-lineItem" onClick={handleCancel}>
              <div className="yg-lineIcon" style={{ color: "#ff4d4f" }}>
                ✖
              </div>
              <div className="yg-lineText">
                <div className="yg-lineValue" style={{ color: "#ff4d4f", fontWeight: 800 }}>
                  Safarni bekor qilish
                </div>
              </div>
              <div className="yg-lineArrow">›</div>
            </div>
          </div>

          <div className="yg-detailsFooter">
            <Button onClick={() => setDetailsOpen(false)} style={{ width: "100%", borderRadius: 16, height: 46 }}>
              Yana ko'rsatish
            </Button>
          </div>
        </div>
      </Drawer>

      {/* CHAT MODAL */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar src={assignedDriver?.avatar_url} icon={<UserOutlined />} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{assignedDriver?.first_name || cp("Haydovchi")}</div>
              <div style={{ fontSize: 11, color: "#888" }}>{assignedDriver?.car_model}</div>
            </div>
          </div>
        }
        open={chatOpen}
        onCancel={() => setChatOpen(false)}
        footer={null}
        centered
        bodyStyle={{ padding: 0 }}
      >
        <div style={{ display: "flex", flexDirection: "column", height: "420px" }}>
          <div style={{ flex: 1, overflowY: "auto", padding: 15, background: "#f5f5f5" }}>
            {messagesState.length === 0 ? (
              <div style={{ textAlign: "center", color: "#999", marginTop: 50 }}>
                Henuz xabarlar yo'q.
                <br /> Haydovchiga yozing!
              </div>
            ) : (
              messagesState.map((msg) => {
                const isMe = msg.sender_role === "client";
                return (
                  <div
                    key={msg.id || msg.created_at}
                    style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginBottom: 10 }}
                  >
                    <div
                      style={{
                        maxWidth: "75%",
                        padding: "8px 12px",
                        borderRadius: 12,
                        background: isMe ? "#1890ff" : "#fff",
                        color: isMe ? "#fff" : "#000",
                        boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                        borderTopRightRadius: isMe ? 0 : 12,
                        borderTopLeftRadius: isMe ? 12 : 0,
                      }}
                    >
                      <div style={{ fontSize: 14 }}>{msg.content}</div>
                      <div style={{ fontSize: 10, opacity: 0.7, textAlign: "right", marginTop: 2 }}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatScrollRef} />
          </div>

          <div
            style={{
              padding: 10,
              background: "#fff",
              borderTop: "1px solid #eee",
              display: "flex",
              gap: 10,
            }}
          >
            <Input
              value={msgText}
              onChange={(e) => setMsgText(e.target.value)}
              onPressEnter={handleSendMessage}
              placeholder="Xabar yozing..."
              style={{ borderRadius: 20 }}
            />
            <Button type="primary" shape="circle" icon={<SendOutlined />} onClick={handleSendMessage} />
          </div>
        </div>
      </Modal>

      {/* RATING */}
      <Modal
        title="Safar tugadi"
        open={ratingOpen}
        onCancel={() => setRatingOpen(false)}
        onOk={() => setRatingOpen(false)}
        okText="Yuborish"
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <Text>Haydovchini baholang:</Text>
          <Rate defaultValue={5} />
        </Space>
      </Modal>

      {/* styles */}
      <style>{`
        .yg-root{position:relative;height:100vh;width:100%;background:#fff;}
        .yg-mapWrap{position:absolute;inset:0;}
        .leaflet-container{background:#dfe6ee;}

        .yg-back{position:absolute;left:16px;top:16px;z-index:900;}
        .yg-locate{position:absolute;right:16px;bottom:340px;z-index:900;}
        .yg-locate .ant-btn{box-shadow:0 6px 18px rgba(0,0,0,.18);border:none;}

        /* Center pin */
        .yg-centerpin{position:absolute;left:50%;top:50%;z-index:800;display:flex;flex-direction:column;align-items:center;gap:10px;pointer-events:none;transition:transform .2s cubic-bezier(.175,.885,.32,1.275);transform:translate(-50%,-68%);} 
        .yg-centerpin.dragging{transform:translate(-50%,-90%) scale(1.15);} 
        .yg-pinlabel{background:rgba(17,17,17,.85);color:#fff;padding:6px 10px;border-radius:12px;font-weight:700;font-size:12px;box-shadow:0 10px 24px rgba(0,0,0,.25);transition:opacity .2s;}
        .yg-centerpin.dragging .yg-pinlabel{opacity:.5;}

        .yg-miniPin{filter: drop-shadow(0 10px 18px rgba(0,0,0,.25));}

        /* bottom sheet */
        .yg-sheet{padding:16px 16px 18px 16px;}
        .yg-sheetHead{display:flex;align-items:center;gap:12px;margin-bottom:12px;}
        .yg-logo{width:44px;height:44px;border-radius:12px;background:conic-gradient(from 180deg, #FFD400, #fff, #111);}

        .yg-bigRow{height:54px;border-radius:18px;background:#f2f2f2;display:flex;align-items:center;justify-content:center;position:relative;cursor:pointer;}
        .yg-bigRowText{font-size:16px;font-weight:700;}
        .yg-bigRowArrow{position:absolute;right:16px;font-size:22px;opacity:.7;}

        .yg-history{margin-top:12px;max-height:150px;overflow:auto;}
        .yg-hItem{cursor:pointer;border-radius:14px;}
        .yg-hItem:hover{background:#fafafa;}
        .yg-hIcon{width:36px;height:36px;border-radius:18px;background:#f4f4f4;display:flex;align-items:center;justify-content:center;margin-right:10px;}
        .yg-hText{flex:1;}
        .yg-hTitle{font-weight:800;font-size:15px;}
        .yg-hSub{font-size:12px;color:#8a8a8a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}

        .yg-homeActions{display:flex;gap:10px;margin-top:12px;}
        .yg-orderBtn{flex:1;height:52px;border-radius:20px;font-weight:900;font-size:16px;}
        .yg-smallBtn{width:56px;height:52px;border-radius:20px;}

        /* confirm */
        .yg-confirmHeader{display:flex;align-items:center;justify-content:space-between;gap:10px;background:#fff;border-radius:18px;padding:10px 12px;box-shadow:0 12px 26px rgba(0,0,0,.08);} 
        .yg-confirmTitle{font-weight:900;font-size:16px;line-height:1.1;}
        .yg-pill{border-radius:999px;height:36px;padding:0 14px;background:#f3f3f3;border:none;font-weight:800;}

        .yg-routeInfo{display:flex;align-items:center;justify-content:space-between;margin-top:10px;}
        .yg-routePill{display:flex;align-items:center;gap:8px;border-radius:14px;background:#fff;padding:8px 12px;box-shadow:0 12px 26px rgba(0,0,0,.08);}

        .yg-tabs{display:flex;gap:18px;margin-top:12px;color:#b5b5b5;font-weight:800;}
        .yg-tabActive{color:#111;background:#efefef;border-radius:999px;padding:6px 12px;}

        .yg-tariffs{display:flex;gap:12px;overflow:auto;padding-top:12px;padding-bottom:10px;}
        .yg-tariff{min-width:150px;border-radius:18px;background:#fff;box-shadow:0 12px 26px rgba(0,0,0,.08);padding:12px;cursor:pointer;}
        .yg-tariff.active{outline:3px solid #FFD400;}
        .yg-tariffEta{font-weight:900;color:#111;}
        .yg-tariffName{margin-top:6px;font-weight:800;color:#777;}
        .yg-tariffPrice{margin-top:10px;font-weight:900;font-size:18px;}

        .yg-confirmActions{display:flex;gap:10px;margin-top:10px;}
        .yg-orderBtnYellow{flex:1;height:56px;border-radius:22px;font-weight:900;font-size:18px;background:#FFD400;color:#111;border:none;}
        .yg-orderBtnYellow:hover{background:#ffdf2d;color:#111;}

        /* destination sheet */
        .yg-destSheet{height:100%;display:flex;flex-direction:column;}
        .yg-topRows{padding:14px 16px 10px 16px;}
        .yg-topRow{display:flex;gap:12px;align-items:flex-start;background:#fff;border-radius:18px;padding:12px;box-shadow:0 12px 26px rgba(0,0,0,.08);margin-bottom:10px;}
        .yg-topIcon{width:46px;height:46px;border-radius:18px;background:#f2f2f2;}
        .yg-topLabel{font-size:12px;color:#999;font-weight:700;}
        .yg-topValue{font-size:18px;font-weight:900;}
        .yg-mapBtn{height:42;border-radius:14px;font-weight:800;background:#efefef;border:none;}

        .yg-suggestions{flex:1;overflow:auto;padding:0 10px 10px 10px;}
        .yg-sItem{cursor:pointer;border-radius:14px;padding-left:10px;padding-right:10px;}
        .yg-sItem:hover{background:#fafafa;}
        .yg-sheetFooter{padding:10px 16px;border-top:1px solid #eee;}

        /* dest map mini card */
        .yg-miniCard{position:absolute;left:50%;transform:translateX(-50%);bottom:130px;z-index:950;background:#fff;border-radius:18px;box-shadow:0 18px 38px rgba(0,0,0,.18);padding:14px 14px;min-width:260px;}
        .yg-miniPrice{display:flex;align-items:center;justify-content:space-between;gap:10px;}
        .yg-miniTime{font-weight:900;font-size:14px;color:#111;}
        .yg-miniMoney{font-weight:900;font-size:18px;color:#111;}

        /* searching */
        .yg-waves{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:700;pointer-events:none;}
        .yg-wave{position:absolute;left:50%;top:50%;width:30px;height:30px;border-radius:50%;border:3px solid rgba(59,130,246,.35);transform:translate(-50%,-50%);animation:ygWave 2.2s infinite;}
        .yg-wave:nth-child(2){animation-delay:.7s;}
        .yg-wave:nth-child(3){animation-delay:1.4s;}
        @keyframes ygWave{0%{opacity:.9;transform:translate(-50%,-50%) scale(.6);}100%{opacity:0;transform:translate(-50%,-50%) scale(7);}}

        .yg-searchPanel{position:absolute;left:16px;right:16px;bottom:18px;z-index:950;background:#fff;border-radius:22px;box-shadow:0 18px 38px rgba(0,0,0,.18);padding:16px;}
        .yg-searchTitle{font-size:18px;font-weight:900;}
        .yg-searchSub{margin-top:4px;color:#888;font-weight:700;}
        .yg-searchBtns{display:flex;gap:12px;margin-top:14px;}
        .yg-grayBtn{flex:1;height:48px;border-radius:18px;background:#f2f2f2;border:none;font-weight:900;}

        .yg-car{width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:20px;filter: drop-shadow(0 6px 10px rgba(0,0,0,.25));}

        /* accepted */
        .yg-accepted{position:absolute;left:16px;right:16px;bottom:18px;z-index:950;}
        .yg-notif{background:rgba(255,255,255,.92);backdrop-filter: blur(10px);border-radius:22px;padding:12px 12px;display:flex;align-items:center;justify-content:space-between;box-shadow:0 18px 38px rgba(0,0,0,.18);} 
        .yg-notifLeft{display:flex;align-items:center;gap:10px;}
        .yg-go{width:38px;height:38px;border-radius:19px;background:#2b2b2b;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:900;}
        .yg-notifTop{font-weight:900;}
        .yg-notifSub{font-size:12px;color:#666;font-weight:700;}
        .yg-eta{margin-top:10px;background:#fff;border-radius:22px;padding:12px 14px;font-size:22px;font-weight:900;box-shadow:0 18px 38px rgba(0,0,0,.18);} 

        .yg-driverCard{margin-top:10px;background:#fff;border-radius:22px;box-shadow:0 18px 38px rgba(0,0,0,.18);padding:14px;} 
        .yg-driverRow{display:flex;justify-content:space-between;gap:12px;}
        .yg-driverTitle{font-weight:900;font-size:16px;}
        .yg-driverSub{color:#666;font-weight:800;margin-top:2px;}
        .yg-plate{margin-top:8px;font-weight:900;font-size:40px;letter-spacing:2px;} 

        .yg-driverActions{display:flex;gap:10px;margin-top:12px;}
        .yg-actionBtn{flex:1;height:48px;border-radius:18px;background:#f2f2f2;border:none;font-weight:900;} 

        .yg-pickRow{margin-top:14px;border-top:1px solid #eee;padding-top:10px;cursor:pointer;}
        .yg-pickLabel{color:#777;font-weight:800;font-size:12px;}
        .yg-pickAddr{font-weight:900;font-size:18px;margin-top:2px;} 

        .yg-detailsHint{margin-top:10px;background:#fff;border-radius:18px;box-shadow:0 18px 38px rgba(0,0,0,.18);height:54px;display:flex;align-items:center;justify-content:center;font-weight:900;cursor:pointer;} 

        /* details drawer */
        .yg-details{height:100%;display:flex;flex-direction:column;padding:14px 16px 16px 16px;}
        .yg-detailsTop{display:flex;justify-content:space-between;align-items:center;}
        .yg-detailsHeader{display:flex;align-items:center;gap:10px;}
        .yg-detailsHeaderText{font-weight:900;}
        .yg-detailBtns{display:flex;gap:10px;margin-top:14px;}

        .yg-detailsList{margin-top:16px;background:#fff;border-radius:22px;box-shadow:0 18px 38px rgba(0,0,0,.12);overflow:hidden;}
        .yg-lineItem{display:flex;align-items:center;gap:12px;padding:14px 14px;border-bottom:1px solid #f0f0f0;cursor:pointer;}
        .yg-lineItem:last-child{border-bottom:none;}
        .yg-lineIcon{width:34px;height:34px;border-radius:17px;background:#f2f2f2;display:flex;align-items:center;justify-content:center;font-weight:900;}
        .yg-lineText{flex:1;}
        .yg-lineLabel{font-size:12px;color:#888;font-weight:800;}
        .yg-lineValue{font-size:16px;font-weight:900;}
        .yg-lineArrow{font-size:22px;opacity:.5;}

        .yg-detailsFooter{margin-top:auto;}

      `}</style>
    </div>
  );
}