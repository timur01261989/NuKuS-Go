import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

// UI komponentlar faqat 'antd' dan olinadi
import { Button, Card, Drawer, Input, List, Space, Typography, message, Modal, Rate, Avatar } from "antd";

// Ikonkalar faqat '@ant-design/icons' dan olinadi
import {
  EnvironmentOutlined,
  SearchOutlined,
  SwapOutlined,
  StarFilled,
  ClockCircleOutlined,
  WalletOutlined,
  AimOutlined,
  SendOutlined,
  UserOutlined
} from "@ant-design/icons";

import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { playAliceVoice } from "@/utils/AudioPlayer";
import api from "@/utils/apiHelper";
import { supabase } from "@/lib/supabase";

const { Text, Title } = Typography;
/** ---------------- ICONS (Yandex-like pins) ---------------- */
const pickupIcon = L.divIcon({
  html: `
    <div style="
      width:38px;height:38px;border-radius:19px;
      background:#111; display:flex;align-items:center;justify-content:center;
      box-shadow:0 8px 18px rgba(0,0,0,.25);
      border:2px solid #fff;
      font-size:20px;
    ">🙋</div>
  `,
  className: "",
  iconSize: [38, 38],
  iconAnchor: [19, 38],
});

const destIcon = L.divIcon({
  html: `
    <div style="
      width:40px;height:40px;border-radius:20px;
      background:#FFD400; display:flex;align-items:center;justify-content:center;
      box-shadow:0 8px 18px rgba(0,0,0,.25);
      border:2px solid #111;
      font-size:18px;
    ">🎯</div>
  `,
  className: "",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

const centerPinIcon = (type) => `
  <div style="
    width:46px;height:46px;border-radius:23px;
    background:${type === "pickup" ? "#111" : "#FFD400"};
    display:flex;align-items:center;justify-content:center;
    box-shadow:0 10px 22px rgba(0,0,0,.25);
    border:2px solid ${type === "pickup" ? "#fff" : "#111"};
    font-size:22px;
  ">${type === "pickup" ? "🙋" : "🎯"}</div>
  <div style="
    position:absolute;left:50%;transform:translateX(-50%);
    top:44px;width:0;height:0;
    border-left:10px solid transparent;border-right:10px solid transparent;
    border-top:16px solid ${type === "pickup" ? "#111" : "#FFD400"};
    filter: drop-shadow(0 6px 10px rgba(0,0,0,.25));
  "></div>
`;

/** ---------------- TARIFFS ---------------- */
const TARIFFS = [
  { id: "start", name: "Start", base: 6000, perKm: 1500, eta: "3 min" },
  { id: "comfort", name: "Komfort", base: 10000, perKm: 2000, eta: "5 min" },
  { id: "delivery", name: "Yetkazish", base: 8000, perKm: 1700, eta: "8 min" },
];

const fmtMoney = (n) => {
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("ru-RU").format(Math.round(n));
};

async function nominatimSearch(q) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=7&addressdetails=1&q=${encodeURIComponent(
    q
  )}`;
  const res = await fetch(url, { signal, headers: { "Accept-Language": "uz,ru,en" } });
  if (!res.ok) return [];
  const data = await res.json();
  return (data || []).map((x) => ({
    id: x.place_id,
    label: x.display_name,
    lat: parseFloat(x.lat),
    lng: parseFloat(x.lon),
  }));
}

async function nominatimReverse(lat, lng, signal) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
  const res = await fetch(url, { headers: { "Accept-Language": "uz,ru,en" } });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.display_name || null;
}

async function osrmRoute(from, to) {
  const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson&alternatives=false&steps=false`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("route fetch failed");
  const data = await res.json();
  const r = data?.routes?.[0];
  if (!r) throw new Error("no route");
  const coords = r.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
  return {
    coords,
    distanceKm: (r.distance || 0) / 1000,
    durationMin: (r.duration || 0) / 60,
  };
}

/** Fallback distance if OSRM fails */
function haversineKm(a, b) {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;

  const s =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);

  return 2 * R * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}


/** Move map to center helper */
function FlyTo({ center, zoom = 16 }) {
  const map = useMap();
  useEffect(() => {
    if (center && Array.isArray(center)) {
      map.flyTo(center, zoom, { animate: true, duration: 0.8 });
    }
  }, [center, zoom, map]);
  return null;
}

/** Map center tracking while selecting pickup/dest (Yandex-like: pin fixed, map moves) */
function CenterTracker({ enabled, onCenter, setIsDragging }) {
  const map = useMap();

  useEffect(() => {
    if (!enabled) return;

    const onMoveStart = () => setIsDragging(true); // Harakat boshlandi
    const onMoveEnd = () => {
      setIsDragging(false); // Harakat tugadi
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

export default function ClientOrderCreate() {
  const [userLoc, setUserLoc] = useState([42.4602, 59.6166]); // Nukus fallback
  const [pickup, setPickup] = useState({ latlng: null, address: "Hozirgi joylashuv..." });
  const [dest, setDest] = useState({ latlng: null, address: "" });

  const [selecting, setSelecting] = useState(null); // "pickup" | "dest" | null
  const [isDragging, setIsDragging] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(true);

  const [tariff, setTariff] = useState(TARIFFS[0]);

  const [routeCoords, setRouteCoords] = useState([]);
  const [distanceKm, setDistanceKm] = useState(null);
  const [durationMin, setDurationMin] = useState(null);

  const [pickupQuery, setPickupQuery] = useState("");
  const [destQuery, setDestQuery] = useState("");
  const [pickupSug, setPickupSug] = useState([]);
  const [destSug, setDestSug] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const [recentPlaces, setRecentPlaces] = useState([]);

  // ✅ Missing states (used in code below)
  const [orderId, setOrderId] = useState(() => {
    const saved = localStorage.getItem("activeOrderId");
    return saved ? String(saved) : null;
  });
  const [orderStatus, setOrderStatus] = useState(null);
  const [assignedDriver, setAssignedDriver] = useState(null);

  // ✅ Chat & Rating (connected)
  const [chatOpen, setChatOpen] = useState(false);

  // --- CHAT STATE ---
  const [messages, setMessages] = useState([]);
  const [msgText, setMsgText] = useState("");
  const chatScrollRef = useRef(null);

  const [ratingOpen, setRatingOpen] = useState(false);
  const [ratingValue, setRatingValue] = useState(5);
  const [completedOrderId, setCompletedOrderId] = useState(null);


  // ✅ Serverdan aktiv buyurtmani tekshirish (localStorage bo‘sh bo‘lsa ham)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.post("/api/order", { action: "active" });
        const ord = res?.data?.order || res?.order || res?.data || null;
        if (!mounted || !ord?.id) return;

        const s = String(ord.status || "").toLowerCase();
        if (["cancelled", "completed", "finished", "done"].includes(s)) return;

        localStorage.setItem("activeOrderId", String(ord.id));
        setOrderId(String(ord.id));
        setOrderStatus(ord.status || null);
        if (ord.driver || ord.assigned_driver) setAssignedDriver(ord.driver || ord.assigned_driver);
      } catch {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);


  /** seed recent places if empty */
  const seedPlaces = useMemo(
    () => [
      { label: "Allayar Dosnazarov ko‘chasi", lat: 42.4615, lng: 59.6109, starred: true },
      { label: "Spartak Stadium, Bustansaray ko‘chasi", lat: 42.4629, lng: 59.6232, starred: true },
      { label: "Registon ko‘chasi", lat: 42.4549, lng: 59.6172, starred: false },
    ],
    []
  );

  /** Geolocation */
  useEffect(() => {
    let cancelled = false;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          if (cancelled) return;
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setUserLoc([lat, lng]);
          setPickup((p) => ({ ...p, latlng: [lat, lng] }));

          // reverse to show readable pickup address
          try {
            const addr = await nominatimReverse(lat, lng);
            if (!cancelled && addr) setPickup((p) => ({ ...p, address: addr }));
          } catch {}
        },
        () => {
          // ignore, keep fallback
        },
        { enableHighAccuracy: true, timeout: 9000 }
      );
    }
    return () => {
      cancelled = true;
    };
  }, []);

  /** Load recent places (local + last orders) */
  useEffect(() => {
    (async () => {
      // local
      const raw = localStorage.getItem("recentPlaces_v1");
      if (raw) {
        try {
          const arr = JSON.parse(raw);
          if (Array.isArray(arr) && arr.length) {
            setRecentPlaces(arr.slice(0, 12));
            return;
          }
        } catch {}
      }
      setRecentPlaces(seedPlaces);      // server (last orders) - via api helper
      try {
        const res = await api.post("/api/order", { action: "history", limit: 12 });
        const rows = res?.data?.orders || res?.orders || [];
        const mapped =
          (rows || [])
            .map((o) => ({
              label: o.dropoff_location || o.to_address || o.pickup_location || o.from_address,
              lat: Number(o.to_lat ?? o.dest_lat ?? o.from_lat),
              lng: Number(o.to_lng ?? o.dest_lng ?? o.from_lng),
              starred: false,
            }))
            .filter((x) => x.label && Number.isFinite(x.lat) && Number.isFinite(x.lng)) || [];

        if (mapped.length) {
          const merged = [...seedPlaces];
          for (const it of mapped) {
            if (!merged.some((m) => m.label === it.label)) merged.push(it);
          }
          setRecentPlaces(merged.slice(0, 12));
          localStorage.setItem("recentPlaces_v1", JSON.stringify(merged.slice(0, 12)));
        }
      } catch {
        // ignore (fallback stays)
      }
    })();
  }, [seedPlaces]);

  /** Route calculation */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!pickup.latlng || !dest.latlng) {
        setRouteCoords([]);
        setDistanceKm(null);
        setDurationMin(null);
        return;
      }
      try {
        const r = await osrmRoute(pickup.latlng, dest.latlng);
        if (cancelled) return;
        setRouteCoords(r.coords);
        setDistanceKm(r.distanceKm);
        setDurationMin(r.durationMin);
      } catch (e) {
        if (!cancelled) {
          setRouteCoords([]);
          // Fallback: approximate by haversine (straight line)
          try {
            const approx = haversineKm(pickup.latlng, dest.latlng);
            setDistanceKm(Number.isFinite(approx) ? approx : null);
          } catch {
            setDistanceKm(null);
          }
          setDurationMin(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pickup.latlng, dest.latlng]);

  const approxDistanceKm = useMemo(() => {
    if (!pickup.latlng || !dest.latlng) return null;
    try {
      const d = haversineKm(pickup.latlng, dest.latlng);
      return Number.isFinite(d) ? d : null;
    } catch {
      return null;
    }
  }, [pickup.latlng, dest.latlng]);

  const totalPrice = useMemo(() => {
    // If route distance not ready yet, use approximate (straight-line) distance for a better estimate
    const d = Number.isFinite(distanceKm) ? distanceKm : approxDistanceKm;
    if (!Number.isFinite(d)) return tariff.base;
    return Math.round(tariff.base + d * tariff.perKm);
  }, [distanceKm, approxDistanceKm, tariff]);

  /** Save to recents */
  const pushRecent = useCallback(
    (place) => {
      if (!place?.label || !Number.isFinite(place.lat) || !Number.isFinite(place.lng)) return;
      setRecentPlaces((prev) => {
        const next = [place, ...prev.filter((p) => p.label !== place.label)].slice(0, 12);
        localStorage.setItem("recentPlaces_v1", JSON.stringify(next));
        return next;
      });
    },
    [setRecentPlaces]
  );

  /** Center picked from map */
  const reverseAbortRef = useRef(null);
  const reverseTimerRef = useRef(null);

  const handleCenterPicked = useCallback(
    (latlng) => {
      if (!selecting) return;

      // Optimistic latlng update for immediate UI responsiveness
      if (selecting === "pickup") {
        setPickup((p) => ({ ...p, latlng, address: p.address || "Manzil aniqlanmoqda..." }));
      } else {
        setDest((d) => ({ ...d, latlng, address: d.address || "Manzil aniqlanmoqda..." }));
      }

      // Debounce reverse geocode to avoid too many requests while user drags map
      if (reverseTimerRef.current) clearTimeout(reverseTimerRef.current);
      if (reverseAbortRef.current) reverseAbortRef.current.abort();

      const controller = new AbortController();
      reverseAbortRef.current = controller;

      reverseTimerRef.current = window.setTimeout(async () => {
        try {
          const addr = await nominatimReverse(latlng[0], latlng[1], controller.signal);
          if (selecting === "pickup") {
            setPickup({ latlng, address: addr || "Tanlangan nuqta" });
          } else {
            setDest({ latlng, address: addr || "Tanlangan nuqta" });
          }
        } catch (e) {
          // ignore aborts, keep latlng
        }
      }, 450);
    },
    [selecting]
  );


  /** Search */
  const runSearch = useCallback(async (type, q) => {
    const query = (q || "").trim();
    if (query.length < 3) {
      if (type === "pickup") setPickupSug([]);
      else setDestSug([]);
      return;
    }
    setSearchLoading(true);
    try {
      const res = await nominatimSearch(query);
      if (type === "pickup") setPickupSug(res);
      else setDestSug(res);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  /** Pick from suggestion / recent */
  const applyPlace = useCallback(
    (type, place) => {
      const latlng = [place.lat, place.lng];
      if (type === "pickup") {
        setPickup({ latlng, address: place.label });
        setPickupQuery(place.label);
      } else {
        setDest({ latlng, address: place.label });
        setDestQuery(place.label);
      }
      pushRecent({ label: place.label, lat: place.lat, lng: place.lng, starred: !!place.starred });
      setSelecting(null);
      setDrawerOpen(true);
    },
    [pushRecent]
  );

  const swapPoints = useCallback(() => {
    if (!pickup.latlng && !dest.latlng) return;
    const p = pickup;
    const d = dest;
    setPickup(d.latlng ? d : { ...p, address: p.address }); // keep if dest empty
    setDest(p.latlng ? p : { ...d, address: d.address });
    setPickupQuery(d.address || "");
    setDestQuery(p.address || "");
  }, [pickup, dest]);

  /** Order action (creates order + keeps compatibility with your backend) */
  const handleOrder = useCallback(async () => {
    if (!pickup.latlng || !dest.latlng) {
      message.error("Borish va yakuniy manzilni belgilang");
      return;
    }
    try {
      const payload = {
        status: "searching",
        price: Math.round(totalPrice),
        service_type: tariff.id,
        pickup_location: pickup.address || "Belgilanmagan manzil",
        dropoff_location: dest.address || "Belgilanmagan manzil",
        from_lat: pickup.latlng[0],
        from_lng: pickup.latlng[1],
        to_lat: dest.latlng[0],
        to_lng: dest.latlng[1],
        distance_km: distanceKm ? Number(distanceKm.toFixed(2)) : null,
      };

      // 1) Create order (server-side handles auth/session)
      const created = await api.post("/api/order", { action: "create", ...payload });
      const order = created?.data?.order || created?.order || created?.data || null;
      const id = order?.id || order?.orderId || created?.data?.orderId || created?.orderId;

      if (!id) {
        throw new Error("orderId not returned from /api/order create");
      }

      localStorage.setItem("activeOrderId", String(id));
      setOrderId(String(id));
      setOrderStatus(order?.status || "searching");
      message.success("Buyurtma yuborildi");

      // 2) Dispatch / radar (find driver)
      try {
        await api.post("/api/dispatch", {
          orderId: String(id),
          serviceType: tariff.id,
          from: { lat: payload.from_lat, lng: payload.from_lng, address: payload.pickup_location },
          to: { lat: payload.to_lat, lng: payload.to_lng, address: payload.dropoff_location },
          distanceKm: payload.distance_km,
          price: payload.price,
        });
      } catch (e2) {
        // dispatch can be async; status polling will still pick updates
        console.warn("dispatch error", e2);
        message.error("Haydovchi qidirishda xatolik");
      }

    } catch (e) {
      console.error(e);
      message.error("Zakaz berishda xato");
    }
  }, [pickup, dest, tariff, totalPrice, distanceKm]);

  /** Polling order status (Vercel-friendly). Checks every 4 seconds. */
  useEffect(() => {
    if (!orderId) return;

    let stopped = false;

    const tick = async () => {
      try {
        const res = await api.post("/api/order", { action: "status", orderId: String(orderId) });
        const ord = res?.data?.order || res?.order || res?.data || null;
        if (!ord || stopped) return;

        setOrderStatus(ord.status || null);
        if (ord.driver || ord.assigned_driver) setAssignedDriver(ord.driver || ord.assigned_driver);

        const s = String(ord.status || "").toLowerCase();
        if (["cancelled", "completed", "finished", "done"].includes(s)) {
        if (["completed","finished","done"].includes(s)) {
                  setCompletedOrderId(orderId);
                  setRatingOpen(true);
                }
// Status o'zgarishini tekshiradigan useEffect ichida:
if (res.status === 'driver_assigned' && orderStatus !== 'driver_assigned') {
   playAliceVoice('driver_found'); // "Haydovchi topildi"
}
if (res.status === 'arrived' && orderStatus !== 'arrived') {
   playAliceVoice('arrived'); // "Mashina yetib keldi"
}
          localStorage.removeItem("activeOrderId");
          setOrderId(null);
        }
      } catch (e) {
        // ignore transient errors
        console.warn("status poll error", e);
      }
    };

    tick();
    const t = setInterval(tick, 4000);
    return () => {
      stopped = true;
      clearInterval(t);
    };
  }, [orderId]);



  /** UI helpers */
  const hasActiveOrder = useMemo(() => {
    if (!orderId) return false;
    const s = String(orderStatus || "").toLowerCase();
    return !["cancelled", "completed", "finished", "done"].includes(s);
  }, [orderId, orderStatus]);

  const uiMode = useMemo(() => {
    const s = String(orderStatus || "").toLowerCase();
    if (!hasActiveOrder) return "idle";
    if (["searching", "pending", "pending_dispatch"].includes(s)) return "searching";
    if (["accepted", "assigned", "coming", "enroute"].includes(s)) return "coming";
    if (["arrived"].includes(s)) return "arrived";
    if (["in_trip", "ontrip", "driving"].includes(s)) return "in_trip";
    return "searching";
  }, [orderStatus, hasActiveOrder]);

  const cancelActiveOrder = useCallback(async () => {
    if (!orderId) return;
    try {
      await api.post("/api/order", { action: "cancel", orderId: String(orderId) });
    } catch (e) {
      console.warn(e);
      // even if cancel fails, allow local reset
    } finally {
      localStorage.removeItem("activeOrderId");
      setOrderId(null);
      setOrderStatus(null);
      setAssignedDriver(null);
      message.info("Buyurtma bekor qilindi");
    }
  }, [orderId]);

  const openChat = useCallback(() => {
    setChatOpen(true);
  }, []);

  const closeChat = useCallback(() => setChatOpen(false), []);

  // Chat pastga tushishi uchun yordamchi
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      chatScrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, []);

  // --- CHAT REALTIME LOGIC ---
  useEffect(() => {
    if (!chatOpen || !orderId) return;

    let mounted = true;

    // 1) Eski xabarlarni yuklash
    const fetchHistory = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: true });

      if (!error && data && mounted) {
        setMessages(data);
        scrollToBottom();
      }
    };

    fetchHistory();

    // 2) Jonli kuzatish (Realtime)
    const channel = supabase
      .channel(`chat_room:${orderId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `order_id=eq.${orderId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [chatOpen, orderId, scrollToBottom]);

  // Xabar yuborish funksiyasi
  const handleSendMessage = useCallback(async () => {
    if (!msgText.trim() || !orderId) return;

    const textToSend = msgText.trim();
    setMsgText("");

    await supabase.from("messages").insert([{
      order_id: orderId,
      sender_role: "client",
      content: textToSend,
      created_at: new Date().toISOString()
    }]);
  }, [msgText, orderId]);



  const submitRating = useCallback(async () => {
    try {
      if (!completedOrderId) {
        setRatingOpen(false);
        return;
      }
      // optional backend action; safe even if not implemented (won't break UI)
      await api.post("/api/order", { action: "rate", orderId: completedOrderId, rating: ratingValue });
    } catch (e) {
      console.warn("rating submit error", e);
    } finally {
      setRatingOpen(false);
      setCompletedOrderId(null);
      // clear active order after rating step
      localStorage.removeItem("activeOrderId");
      setOrderId(null);
      setOrderStatus(null);
      setAssignedDriver(null);
    }
  }, [completedOrderId, ratingValue]);

  const skipRating = useCallback(() => {
    setRatingOpen(false);
    setCompletedOrderId(null);
    localStorage.removeItem("activeOrderId");
    setOrderId(null);
    setOrderStatus(null);
    setAssignedDriver(null);
  }, []);


const bottomTitle = useMemo(() => {
    if (!pickup.latlng || !dest.latlng) return "Manzilni tanlang";
    const dist = distanceKm ? `${distanceKm.toFixed(1)} km` : "—";
    const dur = durationMin ? `${Math.round(durationMin)} min` : "—";
    return `${dist} • ${dur}`;
  }, [pickup.latlng, dest.latlng, distanceKm, durationMin]);

  return (
    <div className="yg-root">
      {/* MAP */}
      <div className="yg-map">
        <MapContainer center={userLoc} zoom={16} zoomControl={false} style={{ height: "100%", width: "100%" }} whenCreated={(m) => (mapRef.current = m)}>
          {/* Tiles (Night/Day) */}
          <TileLayer
            url={
              document.body.classList.contains("night-mode-active")
                ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            }
          />

          <FlyTo center={
            hasActiveOrder && assignedDriver?.lat && assignedDriver?.lng && (uiMode === "coming" || uiMode === "arrived" || uiMode === "in_trip")
              ? [assignedDriver.lat, assignedDriver.lng]
              : selecting === "pickup"
                ? pickup.latlng || userLoc
                : selecting === "dest"
                  ? dest.latlng || userLoc
                  : null
          } />

          <CenterTracker enabled={!!selecting} onCenter={handleCenterPicked} setIsDragging={setIsDragging} />

          {pickup.latlng && !selecting && <Marker position={pickup.latlng} icon={pickupIcon} />}
          {dest.latlng && !selecting && <Marker position={dest.latlng} icon={destIcon} />}

          {routeCoords.length > 1 && (
            <Polyline
              positions={routeCoords}
              pathOptions={{ color: "#00C853", weight: 6, opacity: 0.95, lineCap: "round" }}
            />
          )}
        {/* "MENING JOYLASHUVIM" TUGMASI */}
        <div
          style={{
            position: "absolute",
            right: 16,
            bottom: uiMode === "main" ? 280 : 320,
            zIndex: 800,
          }}
        >
          <Button
            shape="circle"
            size="large"
            icon={<AimOutlined style={{ fontSize: 22 }} />}
            style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
            onClick={() => {
              const map = mapRef.current;
              if (map && userLoc) map.flyTo(userLoc, 16);
            }}
          />
        </div>
        </MapContainer>

        {/* Center pin overlay */}
        {selecting && (
          <div className={`yg-centerpin ${isDragging ? 'dragging' : ''}`} aria-hidden>
            <div
              style={{ position: "relative", width: 70, height: 80 }}
              dangerouslySetInnerHTML={{ __html: centerPinIcon(selecting) }}
            />
            <div className="yg-pinlabel">
              {selecting === "pickup" ? "Qayerdan ketasiz?" : "Yakuniy nuqta"}
            </div>
          </div>
        )}


        {/* Active order overlays */}
        {hasActiveOrder && (
          <div className="yg-active">
            {uiMode === "searching" && (
              <Card className="yg-active-card" bodyStyle={{ padding: 14 }}>
                <div className="yg-active-title">Mashina qidirilmoqda...</div>
                <div className="yg-active-sub">Buyurtma: #{orderId}</div>
                <div className="yg-active-actions">
                  <Button danger block onClick={cancelActiveOrder}>Bekor qilish</Button>
                </div>
              </Card>
            )}

            {(uiMode === "coming" || uiMode === "arrived" || uiMode === "in_trip") && (
              <Card className="yg-active-card" bodyStyle={{ padding: 14 }}>
                <div className="yg-driver-row">
                  <div className="yg-driver-avatar">
                    {(assignedDriver?.photo_url || assignedDriver?.avatar) ? (
                      <img alt="driver" src={assignedDriver.photo_url || assignedDriver.avatar} />
                    ) : (
                      <div className="yg-driver-placeholder">👤</div>
                    )}
                  </div>
                  <div className="yg-driver-info">
                    <div className="yg-driver-name">{assignedDriver?.name || "Haydovchi"}</div>
                    <div className="yg-driver-car">
                      {assignedDriver?.car_model || "Mashina"} • {assignedDriver?.plate || assignedDriver?.car_plate || "—"}
                    </div>
                    <div className="yg-driver-status">
                      {uiMode === "coming" && "Yo‘lda"}
                      {uiMode === "arrived" && "Keldi"}
                      {uiMode === "in_trip" && "Safarda"}
                    </div>
                  </div>
                </div>

                <div className="yg-active-actions two">
                  <Button onClick={openChat} block>Chat</Button>
                  <Button danger onClick={cancelActiveOrder} block>Bekor qilish</Button>
                </div>
              </Card>
            )}
          </div>
        )}


        {/* Top card (Yandex-like) */}
        {!hasActiveOrder && (
          <div className="yg-topcard">
            <Card className="yg-card" bodyStyle={{ padding: 12 }}>
              <div className="yg-row">
                <div className="yg-dot blue" />
                <Text className="yg-addr">{pickup.address || "Qayerdan ketasiz?"}</Text>
                <Button size="small" className="yg-mini" onClick={() => { setSelecting("pickup"); setDrawerOpen(false); }}>
                  Tanlash
                </Button>
              </div>

              <div className="yg-row">
                <div className="yg-dot red" />
                <Input
                  value={destQuery}
                  onChange={(e) => {
                    setDestQuery(e.target.value);
                    runSearch("dest", e.target.value);
                  }}
                  onFocus={() => setDrawerOpen(true)}
                  placeholder="Qayerga borasiz?"
                  prefix={<SearchOutlined />}
                  className="yg-input"
                  allowClear
                />
                <Button
                  size="small"
                  className="yg-mini"
                  onClick={() => {
                    setSelecting("dest");
                    setDrawerOpen(false);
                  }}
                >
                  Xaritadan
                </Button>
              </div>

              <div className="yg-swap">
                <Button icon={<SwapOutlined />} onClick={swapPoints} />
              </div>
            </Card>
          </div>
        )}

        {/* Bottom sheet */}
      {!hasActiveOrder && (
      <Drawer
        open={drawerOpen && !selecting}
        onClose={() => setDrawerOpen(false)}
        placement="bottom"
        height={380}
        bodyStyle={{ padding: 12 }}
        mask={false}
        className="yg-drawer"
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <EnvironmentOutlined />
            <span>{bottomTitle}</span>
          </div>
        }
      >
        {/* Recent places */}
        <div className="yg-section">
          <div className="yg-section-title">Oldingi manzillar</div>
          <List
            size="small"
            dataSource={recentPlaces}
            locale={{ emptyText: "Hali manzillar yo‘q" }}
            renderItem={(item) => (
              <List.Item
                className="yg-place"
                onClick={() => applyPlace("dest", item)}
                style={{ cursor: "pointer" }}
              >
                <Space>
                  {item.starred ? <StarFilled style={{ color: "#FFD400" }} /> : <EnvironmentOutlined />}
                  <span className="yg-place-text">{item.label}</span>
                </Space>
              </List.Item>
            )}
          />
        </div>

        {/* Destination search suggestions */}
        {(destSug?.length > 0 || searchLoading) && (
          <div className="yg-section">
            <div className="yg-section-title">Qidiruv natijalari</div>
            <List
              size="small"
              loading={searchLoading}
              dataSource={destSug}
              renderItem={(item) => (
                <List.Item className="yg-place" onClick={() => applyPlace("dest", item)} style={{ cursor: "pointer" }}>
                  <Space>
                    <SearchOutlined />
                    <span className="yg-place-text">{item.label}</span>
                  </Space>
                </List.Item>
              )}
            />
          </div>
        )}

        {/* Tariffs */}
        <div className="yg-tariffs">
          {TARIFFS.map((t) => {
            const active = t.id === tariff.id;
            const pricePreview = distanceKm ? t.base + distanceKm * t.perKm : t.base;
            return (
              <div
                key={t.id}
                className={`yg-tariff ${active ? "active" : ""}`}
                onClick={() => setTariff(t)}
              >
                <div className="yg-tariff-name">{t.name}</div>
                <div className="yg-tariff-sub">
                  <ClockCircleOutlined /> {t.eta}
                </div>
                <div className="yg-tariff-price">
                  <WalletOutlined /> {fmtMoney(pricePreview)} so‘m
                </div>
              </div>
            );
          })}
        </div>

        {/* Order button */}
        <div className="yg-orderbar">
          <div className="yg-total">
            <div className="yg-total-label">Jami</div>
            <div className="yg-total-value">{fmtMoney(totalPrice)} so‘m</div>
          </div>
          <Button
            type="primary"
            size="large"
            className="yg-orderbtn"
            disabled={!pickup.latlng || !dest.latlng}
            onClick={handleOrder}
          >
            Zakaz berish
          </Button>
        </div>
      </Drawer
      )}>

      
      {/* CHAT MODAL (YANGILANGAN) */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar src={assignedDriver?.avatar_url} icon={<UserOutlined />} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>
                {assignedDriver?.first_name || "Haydovchi"}
              </div>
              <div style={{ fontSize: 11, color: "#888" }}>
                {assignedDriver?.car_model || ""}
              </div>
            </div>
          </div>
        }
        open={chatOpen}
        onCancel={() => setChatOpen(false)}
        footer={null}
        centered
        bodyStyle={{ padding: 0 }}
      >
        <div style={{ display: "flex", flexDirection: "column", height: "400px" }}>
          {/* Xabarlar oynasi */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "15px",
              background: "#f5f5f5",
            }}
          >
            {messages.length === 0 ? (
              <div style={{ textAlign: "center", color: "#999", marginTop: 50 }}>
                Henuz xabarlar yo‘q. <br /> Haydovchiga yozing!
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender_role === "client";
                return (
                  <div
                    key={msg.id}
                    style={{
                      display: "flex",
                      justifyContent: isMe ? "flex-end" : "flex-start",
                      marginBottom: 10,
                    }}
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
                      <div
                        style={{
                          fontSize: 10,
                          opacity: 0.7,
                          textAlign: "right",
                          marginTop: 2,
                        }}
                      >
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatScrollRef} />
          </div>

          {/* Yozish joyi */}
          <div
            style={{
              padding: "10px",
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
            <Button
              type="primary"
              shape="circle"
              icon={<SendOutlined />}
              onClick={handleSendMessage}
            />
          </div>
        </div>
      </Modal>

      {/* Rating Modal */}
      <Modal
        open={ratingOpen}
        title="Safar yakunlandi"
        onOk={submitRating}
        onCancel={skipRating}
        okText="Baholash"
        cancelText="Keyinroq"
      >
        <div style={{ marginBottom: 10 }}>
          Haydovchini baholang:
        </div>
        <Rate value={ratingValue} onChange={setRatingValue} />
      </Modal>

<style>{`
        .yg-root { height: 100vh; width: 100%; background:#000; overflow:hidden; }
        .yg-map { position: relative; height: 100%; width: 100%; }
        .yg-topcard { position:absolute; left:16px; right:16px; top:14px; z-index: 500; }
        .yg-card { border-radius: 18px; box-shadow: 0 12px 30px rgba(0,0,0,.18); }
        .yg-row { display:flex; align-items:center; gap:10px; margin-bottom:10px; position:relative; }
        .yg-row:last-child { margin-bottom:0; }
        .yg-dot { width:10px; height:10px; border-radius:50%; flex: 0 0 10px; }
        .yg-dot.blue { background:#1677ff; }
        .yg-dot.red { background:#ff4d4f; }
        .yg-addr { flex:1; font-weight:600; font-size:14px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .yg-input { flex:1; border-radius: 12px; }
        .yg-mini { border-radius: 12px; }
        .yg-swap { position:absolute; right:8px; top:46px; }
        .yg-swap button { border-radius: 12px; }

        .yg-centerpin { 
          position: absolute; 
          left: 50%; 
          top: 50%; 
          z-index: 600; 
          display: flex; 
          flex-direction: column; 
          align-items: center; 
          gap: 10px; 
          pointer-events: none;
          transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          transform: translate(-50%, -68%);
        }

        .yg-centerpin.dragging {
          transform: translate(-50%, -90%) scale(1.15);
        }

        .yg-pinlabel { 
          background: rgba(17,17,17,.85); 
          color: #fff; 
          padding: 6px 10px; 
          border-radius: 12px; 
          font-weight: 600; 
          font-size: 12px; 
          box-shadow: 0 10px 24px rgba(0,0,0,.25); 
          transition: opacity 0.2s;
        }

        .yg-centerpin.dragging .yg-pinlabel {
          opacity: 0.5;
        }

        .yg-drawer .ant-drawer-content { border-top-left-radius: 22px; border-top-right-radius: 22px; }
        .yg-drawer .ant-drawer-header { padding: 10px 12px; }
        .yg-section { margin-bottom: 12px; }
        .yg-section-title { font-weight:700; margin-bottom: 6px; }
        .yg-place { border-radius: 12px; }
        .yg-place:hover { background: rgba(0,0,0,.03); }
        .yg-place-text { display:block; max-width: 100%; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

        .yg-tariffs { display:flex; gap:10px; overflow-x:auto; padding-bottom: 8px; margin-top: 8px; }
        .yg-tariff { min-width: 150px; border:1px solid rgba(0,0,0,.08); border-radius: 16px; padding: 10px; cursor:pointer; }
        .yg-tariff.active { border-color:#111; box-shadow:0 10px 24px rgba(0,0,0,.12); }
        .yg-tariff-name { font-weight:800; }
        .yg-tariff-sub { color: rgba(0,0,0,.65); font-size:12px; margin-top:4px; display:flex; gap:6px; align-items:center; }
        .yg-tariff-price { margin-top:8px; font-weight:800; display:flex; gap:6px; align-items:center; }

        .yg-orderbar { margin-top: 10px; display:flex; align-items:center; justify-content:space-between; gap: 12px; }
        .yg-total-label { color: rgba(0,0,0,.65); font-weight:700; font-size:12px; }
        .yg-total-value { font-weight:900; font-size:18px; }
        .yg-orderbtn { border-radius: 18px; background:#FFD400; border-color:#FFD400; color:#111; font-weight:900; padding: 0 18px; }
        .yg-orderbtn[disabled] { background: #f5f5f5 !important; border-color:#f5f5f5 !important; color: rgba(0,0,0,.35) !important; }


        .yg-active { position:absolute; left:16px; right:16px; bottom: 16px; z-index: 650; }
        .yg-active-card { border-radius: 20px; box-shadow: 0 -6px 26px rgba(0,0,0,.22); }
        .yg-active-title { font-weight: 900; font-size: 16px; }
        .yg-active-sub { margin-top: 4px; color: rgba(0,0,0,.6); font-weight: 700; }
        .yg-active-actions { margin-top: 12px; }
        .yg-active-actions.two { display:flex; gap: 10px; }
        .yg-driver-row { display:flex; gap: 12px; align-items:center; }
        .yg-driver-avatar { width: 52px; height: 52px; border-radius: 16px; overflow:hidden; background:#f5f5f5; display:flex; align-items:center; justify-content:center; }
        .yg-driver-avatar img { width:100%; height:100%; object-fit: cover; }
        .yg-driver-placeholder { font-size: 22px; }
        .yg-driver-info { flex:1; min-width:0; }
        .yg-driver-name { font-weight: 900; font-size: 15px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .yg-driver-car { margin-top: 2px; color: rgba(0,0,0,.65); font-weight: 700; font-size: 12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .yg-driver-status { margin-top: 6px; font-weight: 900; font-size: 12px; }

/* User Marker (Pulsatsiya effekti) */
.user-marker-pulse {
  width: 20px;
  height: 20px;
  background: #1890ff;
  border-radius: 50%;
  border: 3px solid white;
  box-shadow: 0 0 0 0 rgba(24, 144, 255, 0.7);
  animation: pulse-blue 2s infinite;
}

@keyframes pulse-blue {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(24, 144, 255, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(24, 144, 255, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(24, 144, 255, 0); }
}
        /* Leaflet tweaks */
        .leaflet-control-container { display:none; }
      `}</style>
    </div>
  );
}