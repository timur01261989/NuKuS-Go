import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Button,
  Typography,
  Row,
  Col,
  Select,
  DatePicker,
  InputNumber,
  Space,
  message,
  Tag,
  Skeleton,
  Result,
  Divider,
  Modal,
  Input,
  List,
} from "antd";
import {
  ArrowLeftOutlined,
  SearchOutlined,
  EnvironmentFilled,
  CalendarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CarOutlined,
  CheckCircleOutlined,
  EditOutlined,
  CloseCircleOutlined,
  AimOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { supabase } from "../../../lib/supabase";

const { Title, Text } = Typography;

/**
 * ClientInterProvincial.jsx (v5 - fixed & working)
 * - Search inter_prov driver ads (orders)
 * - Passenger sends "request" (NOT auto accept)
 * - Passenger can see own requests after relogin
 * - Passenger can edit/cancel only when status="requested"
 * - Pickup type filter:
 *    - meet_point (Belgilangan joyga kelish) => show driver meet point if exists
 *    - home_pickup (Uydan olib ketish) => passenger sends own geolocation (pickup_lat/lng/address)
 * - Map open button for locations
 *
 * RPCs used (expected):
 *   request_inter_prov_booking  (fallback)
 *   request_inter_prov_booking (preferred - supports pickup fields)
 *   update_inter_prov_booking_seats (fallback)
 *   edit_booking_request (preferred)
 *   cancel_booking_request (fallback)
 *   cancel_booking_request (preferred)
 *
 * If some RPC doesn't exist, code tries fallback.
 */

// --- REGIONS + DISTRICTS (UZ) ---
const REGIONS_DATA = [
  { name: "Qoraqalpog'iston", districts: ["Nukus sh.", "Chimboy", "Qo'ng'irot", "Beruniy", "To'rtko'l", "Mo'ynoq", "Xo'jayli", "Shumanay", "Qanliko'l", "Kegeyli", "Qorao'zak", "Taxtako'pir", "Ellikqala", "Amudaryo", "Bo'zatov", "Nukus tumani"] },
  { name: "Toshkent shahri", districts: ["", "Yunusobod", "Chilonzor", "Mirzo Ulug'bek", "Yashnobod", "Yakkasaroy", "Sergeli", "Uchtepa", "Olmazor", "Bektemir", "Mirobod", "Shayxontohur", "Yangihayot"] },
  { name: "Toshkent viloyati", districts: ["Nurafshon", "Angren", "Olmaliq", "Chirchiq", "Bekobod", "Yangiyo'l", "Oqqo'rg'on", "Ohangaron", "Bo'stonliq", "Bo'ka", "Zangiota", "Qibray", "Quyichirchiq", "Parkent", "Piskent", "O'rtachirchiq", "Chinoz", "Yuqorichirchiq", "Toshkent tumani"] },
  { name: "Xorazm", districts: ["Urganch sh.", "Xiva", "Bog'ot", "Gurlan", "Qo'shko'pir", "Shovot", "Xonqa", "Yangiariq", "Yangibozor", "Tuproqqala", "Hazorasp"] },
  { name: "Buxoro", districts: ["Buxoro sh.", "Kogon", "G'ijduvon", "Jondor", "Qorako'l", "Qorovulbozor", "Olot", "Peshku", "Romitan", "Shofirkon", "Vobkent"] },
  { name: "Navoiy", districts: ["Navoiy sh.", "Zarafshon", "Karmana", "Konimex", "Navbahor", "Nurota", "Tomdi", "Uchquduq", "Xatirchi", "Qiziltepa"] },
  { name: "Samarqand", districts: ["Samarqand sh.", "Kattaqo'rg'on", "Ishtixon", "Jomboy", "Narpay", "Nurobod", "Oqdaryo", "Paxtachi", "Payariq", "Pastdarg'om", "Toyloq", "Bulung'ur", "Urgut"] },
  { name: "Qashqadaryo", districts: ["Qarshi sh.", "Shahrisabz", "Muborak", "Dehqonobod", "Kasbi", "Kitob", "Koson", "Mirishkor", "Nishon", "Chiroqchi", "Yakkabog'", "Qamashi", "G'uzor"] },
  { name: "Surxondaryo", districts: ["Termiz sh.", "Angor", "Boysun", "Denov", "Jarqo'rg'on", "Muzrabot", "Oltinsoy", "Sariosiyo", "Sherobod", "Sho'rchi", "Uzun", "Qiziriq", "Qumqo'rg'on"] },
  { name: "Jizzax", districts: ["Jizzax sh.", "Arnasoy", "Baxmal", "Do'stlik", "Forish", "G'allaorol", "Sharof Rashidov", "Mirzachul", "Paxtakor", "Yangiobod", "Zomin", "Zafarobod"] },
  { name: "Sirdaryo", districts: ["Guliston sh.", "Shirin", "Yangiyer", "Boyovut", "Mirzaobod", "Oqoltin", "Sayhunobod", "Sardoba", "Xovos"] },
  { name: "Andijon", districts: ["Andijon sh.", "Asaka", "Xonobod", "Shahrixon", "Oltinkul", "Baliqchi", "Bo'z", "Buloqboshi", "Izboskan", "Jalaquduq", "Marhamat", "Paxtaobod", "Qo'rg'ontepa", "Xo'jaobod"] },
  { name: "Farg'ona", districts: ["Farg'ona sh.", "Qo'qon", "Marg'ilon", "Quva", "Quvasoy", "Beshariq", "Bog'dod", "Buvayda", "Dang'ara", "Yozyovon", "Oltiariq", "Rishton", "So'x", "Toshloq", "Uchko'prik", "O'zbekiston", "Furqat"] },
  { name: "Namangan", districts: ["Namangan sh.", "Chortoq", "Chust", "Kosonsoy", "Mingbuloq", "Norin", "Pop", "To'raqo'rg'on", "Uchqo'rg'on", "Uychi", "Yangiqo'rg'on"] },
];

const getDistricts = (regionName) => (REGIONS_DATA.find((r) => r.name === regionName)?.districts || []);
const isTashkentCity = (regionName) => regionName === "Toshkent shahri";
const districtLabel = (district) => (district && district.trim() ? district : "Hammasi");
const formatMoney = (n) => Number(n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

const GENDER_OPTIONS = [
  { label: "Hamma", value: "all" },
  { label: "Erkak", value: "male" },
  { label: "Ayol", value: "female" },
];

const normalizeGender = (v) => (v === "male" || v === "female" || v === "all" ? v : "all");

const routeText = (o) => {
  const fromR = o.from_region || "-";
  const fromD = districtLabel(o.from_district);
  const toR = o.to_region || "-";
  const toD = districtLabel(o.to_district);
  return `${fromR} / ${fromD}  →  ${toR} / ${toD}`;
};



/** Leaflet CDN loader (no new tab map picker) */
const loadLeafletCDN = () =>
  new Promise((resolve, reject) => {
    if (typeof window !== "undefined" && window.L) return resolve(window.L);
    const idCss = "leaflet-css-cdn";
    const idJs = "leaflet-js-cdn";

    const ensureCss = () => {
      if (document.getElementById(idCss)) return;
      const link = document.createElement("link");
      link.id = idCss;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
      link.crossOrigin = "";
      document.head.appendChild(link);
    };

    const ensureJs = () => {
      if (document.getElementById(idJs)) return;
      const script = document.createElement("script");
      script.id = idJs;
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
      script.crossOrigin = "";
      script.async = true;
      script.onload = () => resolve(window.L);
      script.onerror = () => reject(new Error("Leaflet yuklanmadi"));
      document.body.appendChild(script);
    };

    try {
      ensureCss();
      ensureJs();
    } catch (e) {
      reject(e);
    }
  });

const reverseGeocodeOSM = async (lat, lng) => {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
    lat
  )}&lon=${encodeURIComponent(lng)}`;
  const res = await fetch(url, {
    headers: { "Accept": "application/json" },
  });
  if (!res.ok) throw new Error("Manzil topilmadi");
  const data = await res.json();
  return data?.display_name || "";
};

const LocationPickerModal = ({ open, title = "Xaritadan tanlash", initialCenter, onCancel, onSelect }) => {
  const [loading, setLoading] = useState(false);
  const [addr, setAddr] = useState("");
  const [center, setCenter] = useState(initialCenter || { lat: 41.311081, lng: 69.240562 }); // Tashkent
  const mapId = useMemo(() => `leaflet_pick_${Math.random().toString(36).slice(2)}`, []);

  useEffect(() => {
    if (!open) return;
    let map;
    let cancelled = false;

    const init = async () => {
      try {
        setLoading(true);
        const L = await loadLeafletCDN();
        if (cancelled) return;

        const el = document.getElementById(mapId);
        if (!el) return;

        // cleanup old
        if (el._leaflet_id) {
          try { el._leaflet_id = null; } catch {}
        }

        map = L.map(el, { zoomControl: true }).setView([center.lat, center.lng], 15);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "&copy; OpenStreetMap",
        }).addTo(map);

        const updateCenter = async () => {
          const c = map.getCenter();
          const next = { lat: Number(c.lat), lng: Number(c.lng) };
          setCenter(next);
          try {
            const a = await reverseGeocodeOSM(next.lat, next.lng);
            if (!cancelled) setAddr(a);
          } catch {
            if (!cancelled) setAddr("");
          }
        };

        map.on("moveend", updateCenter);
        // initial reverse
        await updateCenter();

      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    init();

    return () => {
      cancelled = true;
      try {
        if (map) map.remove();
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Modal
      open={open}
      title={title}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>Bekor qilish</Button>,
        <Button
          key="ok"
          type="primary"
          onClick={() => onSelect?.({ ...center, address: addr })}
          disabled={!center?.lat || !center?.lng}
          loading={loading}
        >
          Tanlash
        </Button>,
      ]}
      width="100%"
      style={{ top: 0, padding: 0 }}
      styles={{ body: { height: "calc(100vh - 140px)" } }}
    >
      <div style={{ position: "relative", height: "100%" }}>
        <div id={mapId} style={{ height: "100%", width: "100%", borderRadius: 12, overflow: "hidden" }} />
        {/* Center pin */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -100%)",
            zIndex: 999,
            pointerEvents: "none",
            fontSize: 34,
            filter: "drop-shadow(0 6px 10px rgba(0,0,0,.45))",
          }}
        >
          📍
        </div>
        <div
          style={{
            position: "absolute",
            left: 12,
            right: 12,
            bottom: 12,
            zIndex: 999,
            background: "rgba(0,0,0,.55)",
            border: "1px solid rgba(255,255,255,.15)",
            borderRadius: 12,
            padding: 10,
            backdropFilter: "blur(6px)",
          }}
        >
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <Text style={{ color: "#fff" }}>
              {loading ? "Manzil aniqlanmoqda..." : (addr || "Manzil topilmadi (lat/lng saqlanadi)")}
            </Text>
            <Text style={{ color: "rgba(255,255,255,.75)", marginLeft: "auto" }}>
              {center.lat?.toFixed?.(6)}, {center.lng?.toFixed?.(6)}
            </Text>
          </div>
        </div>
      </div>
    </Modal>
  );
};


const statusLabel = (s) => {
  if (s === "requested") return { text: "So‘rov yuborildi", color: "gold" };
  if (s === "accepted") return { text: "Qabul qilindi", color: "green" };
  if (s === "rejected") return { text: "Rad etildi", color: "red" };
  if (s === "cancelled") return { text: "Bekor qilingan", color: "default" };
  return { text: s, color: "default" };
};

const openGoogleMaps = (lat, lng, title = "Xarita") => {
  if (lat == null || lng == null) return;
  openMapEmbed({ title, lat, lng, mode: "pin" });
};
const openGoogleDirectionsTo = (lat, lng, sLat, sLng, title = "Yo‘l") => {
  if (lat == null || lng == null) return;
  openMapEmbed({ title, lat, lng, sLat, sLng, mode: "route" });
};
const getMyGeo = async () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Geolokatsiya qo‘llab-quvvatlanmaydi"));
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 20000 }
    );
  });
};

export default function ClientInterProvincial({ onBack }) {

  // In-app map modal (no new tab)
  const [mapModal, setMapModal] = useState({ open: false, url: "", title: "Xarita" });
  const [pickModal, setPickModal] = useState({ open: false, center: null });
  const openMapEmbed = ({ title = "Xarita", lat, lng, sLat, sLng, mode = "pin" }) => {
    const safe = (v) => String(v ?? "").trim();
    const qLat = safe(lat), qLng = safe(lng);
    const aLat = safe(sLat), aLng = safe(sLng);

    let url = "";
    if (mode === "route" && aLat && aLng && qLat && qLng) {
      url = `https://www.google.com/maps?saddr=${aLat},${aLng}&daddr=${qLat},${qLng}&output=embed`;
    } else if (qLat && qLng) {
      url = `https://www.google.com/maps?q=${qLat},${qLng}&output=embed`;
    } else {
      message.error("Lokatsiya topilmadi");
      return;
    }
    setMapModal({ open: true, url, title });
  };

  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  const [results, setResults] = useState([]);
  const [errorText, setErrorText] = useState("");

  // my requests (trip_booking_requests) with joined order
  const [myBookings, setMyBookings] = useState([]);
  const [myLoading, setMyLoading] = useState(false);

  // booking modal
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [bookingSeats, setBookingSeats] = useState(1);

  // passenger info (auto fill + editable)
  const [passengerName, setPassengerName] = useState("");
  const [passengerPhone, setPassengerPhone] = useState("");

  const [passengerGender, setPassengerGender] = useState(() => normalizeGender(localStorage.getItem("passenger_gender") || "all"));
  const [listMode, setListMode] = useState("ride"); // ride | delivery

  // pickup (home_pickup)
  const [deliveryType, setDeliveryType] = useState("meet_point"); // meet_point | home_pickup
  const [pickupLat, setPickupLat] = useState(null);
  const [pickupLng, setPickupLng] = useState(null);
  const [pickupAddress, setPickupAddress] = useState("");

  // edit booking modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editBooking, setEditBooking] = useState(null);
  const [editSeats, setEditSeats] = useState(1);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editGender, setEditGender] = useState("all");

  const [form, setForm] = useState(() => {
    const saved = localStorage.getItem("clientInterProvSearch_v5");
    if (saved) {
      try {
        const p = JSON.parse(saved);
        return {
          fromRegion: p.fromRegion || "Qoraqalpog'iston",
          fromDistrict: p.fromDistrict ?? "Nukus sh.",
          toRegion: p.toRegion || "Toshkent shahri",
          toDistrict: p.toDistrict ?? "",
          date: p.date || "",
          minSeats: Number(p.minSeats || 1),
          gender: normalizeGender(p.gender || "all"),
          pickupMode: p.pickupMode || "all",
        };
      } catch (e) {}
    }
    return {
      fromRegion: "Qoraqalpog'iston",
      fromDistrict: "Nukus sh.",
      toRegion: "Toshkent shahri",
      toDistrict: "",
      date: "",
      minSeats: 1,
      gender: "all",
      pickupMode: "all",
    };
  });

  const fromDistricts = useMemo(() => {
    const list = getDistricts(form.fromRegion);
    return isTashkentCity(form.fromRegion) ? ["", ...list.filter((x) => x !== "")] : list;
  }, [form.fromRegion]);

  const toDistricts = useMemo(() => {
    const list = getDistricts(form.toRegion);
    return isTashkentCity(form.toRegion) ? ["", ...list.filter((x) => x !== "")] : list;
  }, [form.toRegion]);

  const persistSearch = () => {
    localStorage.setItem("clientInterProvSearch_v5", JSON.stringify(form));
  };

  useEffect(() => {
    persistSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  const loadMyBookings = async () => {
try {
  setMyBookingsLoading(true);
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  if (!user) {
    setMyBookings([]);
    return;
  }

  // inter_prov_bookings -> inter_prov_rides (aliased as "order" to keep UI intact)
  const { data, error } = await supabase
    .from("inter_prov_bookings")
    .select("*, order:inter_prov_rides(*)")
    .eq("passenger_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  setMyBookings(Array.isArray(data) ? data : []);
} catch (e) {
  console.error("loadMyBookings error:", e);
  setMyBookings([]);
} finally {
  setMyBookingsLoading(false);
}
};

  const doSearch = async (silent = false) => {
try {
  setSearching(true);

  // Build query on inter_prov_rides (we keep variable name "orders" in state for UI compatibility)
  let q = supabase.from("inter_prov_rides").select("*").order("created_at", { ascending: false }).limit(60);

  // status filter: show only open/active rides
  q = q.in("status", ["open", "active"]);

  if (fromRegion) q = q.eq("from_region", fromRegion);
  if (fromDistrict) q = q.eq("from_district", fromDistrict);
  if (toRegion) q = q.eq("to_region", toRegion);
  if (toDistrict) q = q.eq("to_district", toDistrict);

  // Date filter
  if (rideDate) q = q.eq("ride_date", rideDate);

  // Pickup mode: listMode = "ride" or "delivery"
  // deliveryType typically = "meet_point" | "home_pickup" (or similar)
  if (listMode === "delivery") {
    q = q.eq("pickup_mode", "delivery");
  } else if (deliveryType) {
    q = q.eq("pickup_mode", deliveryType);
  }

  const { data, error } = await q;
  if (error) throw error;

  setOrders(Array.isArray(data) ? data : []);
} catch (e) {
  console.error("doSearch error:", e);
  setOrders([]);
} finally {
  setSearching(false);
}
};

  useEffect(() => {
    let isMounted = true;
    let channel = null;

    const loadAll = async () => {
      try {
        setLoading(true);
        await doSearch(true);
        await loadMyBookings();

        const { data: authData } = await supabase.auth.getUser();
        const user = authData?.user;

        if (user && isMounted) {
          channel = supabase
            .channel("client-interprov-live")
            .on("postgres_changes", { event: "*", schema: "public", table: "inter_prov_rides" }, () => doSearch(true))
            .on("postgres_changes", { event: "*", schema: "public", table: "inter_prov_bookings" }, (payload) => {
              const row = payload?.new || payload?.old;
              if (!row) return;
              if (row.passenger_id === user.id) loadMyBookings();
              doSearch(true);
            })
            .subscribe();
        }
      } catch (e) {
        console.error("ClientInterProvincial init error:", e);
        if (isMounted) setErrorText(e?.message || "Xatolik yuz berdi");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadAll();

    return () => {
      isMounted = false;
      if (channel) supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openBooking = async (order) => {
try {
  const rideId = order?.id;
  if (!rideId) return;

  // Ensure we have the latest ride row
  const { data: ride, error } = await supabase.from("inter_prov_rides").select("*").eq("id", rideId).maybeSingle();
  if (error) throw error;

  if (!ride) {
    alert("E'lon topilmadi.");
    return;
  }

  setSelectedOrder(ride);
  setIsRequestModalOpen(true);

  // Default pickup mode selection for request modal
  if (ride.pickup_mode) {
    setDeliveryType(ride.pickup_mode);
    setListMode(ride.pickup_mode === "delivery" ? "delivery" : "ride");
  }
} catch (e) {
  console.error("openBooking error:", e);
  alert(e?.message || "Ochishda xatolik.");
}
};

  const confirmBookingRequest = async () => {
try {
  if (!selectedOrder?.id) return;

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  if (!user) {
    alert("Avval tizimga kiring (login).");
    return;
  }

  if (!passengerPhone?.trim()) {
    alert("Telefon raqamingizni kiriting.");
    return;
  }

  const seatsNum = Number(seatsToBook || 0);
  if (!Number.isFinite(seatsNum) || seatsNum <= 0) {
    alert("O'rinlar soni noto‘g‘ri.");
    return;
  }

  // Normalization (UI may pass different labels)
  const pickupModeWanted = listMode === "delivery" ? "delivery" : (deliveryType || selectedOrder.pickup_mode || "meet_point");

  // Try RPC v2 first, then fallback to v1, then direct insert.
  let rpcError = null;

  // v2 parameters (most flexible)
  const rpcArgsV2 = {
    p_ride_id: selectedOrder.id,
    p_passenger_id: user.id,
    p_passenger_phone: passengerPhone.trim(),
    p_passenger_gender: passengerGender || null,
    p_seats: seatsNum,
    p_pickup_mode: pickupModeWanted,
    p_pickup_lat: pickupLat ?? null,
    p_pickup_lng: pickupLng ?? null,
    p_pickup_address: pickupAddress || null,
  };

  const { data: rpcDataV2, error: rpcErrV2 } = await supabase.rpc("request_inter_prov_booking_v2", rpcArgsV2);

  if (rpcErrV2) {
    rpcError = rpcErrV2;

    // v1 fallback (some projects used p_order_id instead of p_ride_id)
    const rpcArgsV1 = {
      p_order_id: selectedOrder.id,
      p_passenger_id: user.id,
      p_passenger_phone: passengerPhone.trim(),
      p_passenger_gender: passengerGender || null,
      p_seats: seatsNum,
      p_pickup_mode: pickupModeWanted,
      p_pickup_lat: pickupLat ?? null,
      p_pickup_lng: pickupLng ?? null,
      p_pickup_address: pickupAddress || null,
    };

    const { error: rpcErrV1 } = await supabase.rpc("request_inter_prov_booking", rpcArgsV1);

    if (rpcErrV1) {
      rpcError = rpcErrV1;

      // Direct insert fallback
      const { error: insErr } = await supabase.from("inter_prov_bookings").insert({
        ride_id: selectedOrder.id,
        passenger_id: user.id,
        passenger_phone: passengerPhone.trim(),
        passenger_gender: passengerGender || null,
        seats: seatsNum,
        pickup_lat: pickupLat ?? null,
        pickup_lng: pickupLng ?? null,
        pickup_address: pickupAddress || null,
        status: "requested",
      });

      if (insErr) throw insErr;
    }
  }

  // Refresh bookings + search list
  await loadMyBookings();
  await doSearch();

  // Close modal
  setIsRequestModalOpen(false);
  setEditBookingModal(false);
  setSelectedBooking(null);

  // Clear pickup info for next time
  setPickupLat(null);
  setPickupLng(null);
  setPickupAddress("");

  if (rpcError) {
    // If we fell back successfully, keep quiet; but log for debugging.
    console.warn("request booking RPC fallback used:", rpcError);
  }
} catch (e) {
  console.error("confirmBookingRequest error:", e);
  alert(e?.message || "So'rov yuborishda xatolik.");
}
};

  const openEditBooking = (b) => {
    setEditBooking(b);
    setEditSeats(Number(b.seats || 1));
    setEditName(b.passenger_name || passengerName || "");
    setEditPhone(b.passenger_phone || passengerPhone || "");
    setEditGender(normalizeGender(b.passenger_gender || passengerGender || "all"));
    setPickupLat(b.pickup_lat ?? null);
    setPickupLng(b.pickup_lng ?? null);
    setPickupAddress(b.pickup_address ?? "");
    setEditModalOpen(true);
  };

  const saveEditBookingSeats = async () => {
try {
  if (!selectedBooking?.id) return;

  const seatsNum = Number(editSeats || 0);
  if (!Number.isFinite(seatsNum) || seatsNum <= 0) {
    alert("O'rinlar soni noto‘g‘ri.");
    return;
  }

  // Prefer RPC v2, then v1, then direct update
  let rpcErr = null;

  const { error: rpcErrV2 } = await supabase.rpc("edit_booking_request_v2", {
    p_booking_id: selectedBooking.id,
    p_seats: seatsNum,
  });

  if (rpcErrV2) {
    rpcErr = rpcErrV2;
    const { error: rpcErrV1 } = await supabase.rpc("edit_booking_request", {
      p_booking_id: selectedBooking.id,
      p_seats: seatsNum,
    });

    if (rpcErrV1) {
      rpcErr = rpcErrV1;

      const { error } = await supabase
        .from("inter_prov_bookings")
        .update({ seats: seatsNum })
        .eq("id", selectedBooking.id);

      if (error) throw error;
    }
  }

  await loadMyBookings();
  await doSearch();

  setEditBookingModal(false);
  setSelectedBooking(null);

  if (rpcErr) console.warn("edit booking RPC fallback used:", rpcErr);
} catch (e) {
  console.error("saveEditBookingSeats error:", e);
  alert(e?.message || "Tahrirlashda xatolik.");
}
};

  const cancelBooking = async (b) => {
try {
  if (!booking?.id) return;

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr) throw userErr;

  // Prefer RPC if exists
  let rpcWorked = false;
  const { error: rpcErr } = await supabase.rpc("cancel_booking_request", { p_booking_id: booking.id });

  if (!rpcErr) rpcWorked = true;

  if (!rpcWorked) {
    // Fallback to status update
    const { error } = await supabase
      .from("inter_prov_bookings")
      .update({ status: "cancelled" })
      .eq("id", booking.id)
      .eq("passenger_id", user?.id);

    if (error) throw error;
  }

  await loadMyBookings();
  await doSearch();
} catch (e) {
  console.error("cancelBooking error:", e);
  alert(e?.message || "Bekor qilishda xatolik.");
}
};

  if (loading) {
    return (
      <div style={{ padding: 16 }}>
        <Skeleton active paragraph={{ rows: 12 }} />
      </div>
    );
  }

  return (
    <div style={{ padding: 16, maxWidth: 980, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={onBack} shape="circle" />
        <Title level={4} style={{ margin: 0 }}>Viloyatlar/Tumanlar aro — Yo‘lovchi</Title>
        <Tag color="purple">inter_prov</Tag>
      </div>

      <Row gutter={12}>
        <Col xs={24} lg={14}>
          <Card style={{ borderRadius: 18, border: "none", boxShadow: "0 6px 20px rgba(0,0,0,0.06)" }}>
            <Title level={5} style={{ marginTop: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>Qidiruv filtrlari</span>
              <Select
                value={listMode}
                onChange={(v) => setListMode(v)}
                size="middle"
                style={{ width: 200 }}
                options={[
                  { value: "ride", label: "Yo‘lovchi tashish" },
                  { value: "delivery", label: "Eltish xizmati" },
                ]}
              />
            </Title>

            <Divider orientation="left">Qayerdan</Divider>
            <Row gutter={12}>
              <Col xs={24} md={12}>
                <Text type="secondary">Viloyat</Text>
                <Select value={form.fromRegion} onChange={(v) => setForm((p) => ({ ...p, fromRegion: v, fromDistrict: isTashkentCity(v) ? "" : p.fromDistrict }))} style={{ width: "100%", marginTop: 6 }} size="large">
                  {REGIONS_DATA.map((r) => (
                    <Select.Option key={r.name} value={r.name}>{r.name}</Select.Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} md={12}>
                <Text type="secondary">Tuman/Shahar</Text>
                <Select value={form.fromDistrict} onChange={(v) => setForm((p) => ({ ...p, fromDistrict: v }))} style={{ width: "100%", marginTop: 6 }} size="large">
                  {fromDistricts.map((d) => (
                    <Select.Option key={`${d}`} value={d}>{districtLabel(d)}</Select.Option>
                  ))}
                </Select>
                {isTashkentCity(form.fromRegion) ? <Text type="secondary" style={{ fontSize: 12 }}>* Toshkent shahri uchun tumanni tanlamasa bo‘ladi.</Text> : null}
              </Col>
            </Row>

            <Divider orientation="left">Qayerga</Divider>
            <Row gutter={12}>
              <Col xs={24} md={12}>
                <Text type="secondary">Viloyat</Text>
                <Select value={form.toRegion} onChange={(v) => setForm((p) => ({ ...p, toRegion: v, toDistrict: isTashkentCity(v) ? "" : p.toDistrict }))} style={{ width: "100%", marginTop: 6 }} size="large">
                  {REGIONS_DATA.map((r) => (
                    <Select.Option key={r.name} value={r.name}>{r.name}</Select.Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} md={12}>
                <Text type="secondary">Tuman/Shahar</Text>
                <Select value={form.toDistrict} onChange={(v) => setForm((p) => ({ ...p, toDistrict: v }))} style={{ width: "100%", marginTop: 6 }} size="large">
                  {toDistricts.map((d) => (
                    <Select.Option key={`${d}`} value={d}>{districtLabel(d)}</Select.Option>
                  ))}
                </Select>
                {isTashkentCity(form.toRegion) ? <Text type="secondary" style={{ fontSize: 12 }}>* Toshkent shahri uchun tumanni tanlamasa bo‘ladi.</Text> : null}
              </Col>
            </Row>

            <Divider />

            <Row gutter={12} align="middle">
              <Col xs={24} md={7}>
                <Text type="secondary">Sana (ixtiyoriy)</Text>
                <DatePicker value={form.date ? dayjs(form.date) : null} disabledDate={(current) => current && current < dayjs().startOf("day")} onChange={(d) => setForm((p) => ({ ...p, date: d ? d.format("YYYY-MM-DD") : "" }))} style={{ width: "100%", marginTop: 6 }} size="large" allowClear />
              </Col>
              <Col xs={24} md={6}>
                <Text type="secondary">Minimum joylar</Text>
                <InputNumber min={1} max={20} value={form.minSeats} onChange={(v) => setForm((p) => ({ ...p, minSeats: Number(v || 1) }))} style={{ width: "100%", marginTop: 6 }} size="large" />
              </Col>
              <Col xs={24} md={6}>
                <Text type="secondary">Olib ketish turi</Text>
                <Select
                  value={form.pickupMode}
                  onChange={(v) => setForm((p) => ({ ...p, pickupMode: v }))}
                  style={{ width: "100%", marginTop: 6 }}
                  size="large"
                  options={[
                    { value: "all", label: "Hammasi" },
                    { value: "meet_point", label: "Belgilangan joyga kelish" },
                    { value: "home_pickup", label: "Uydan olib ketish" },
                  ]}
                />
              </Col>
              <Col xs={24} md={5}>
                <Button type="primary" size="large" block icon={<SearchOutlined />} loading={searching} onClick={() => doSearch(false)} style={{ borderRadius: 14, height: 48, marginTop: 24 }}>
                  Qidirish
                </Button>
              </Col>
            </Row>

            <Row gutter={12} style={{ marginTop: 10 }}>
              <Col xs={24} md={12}>
                <Text type="secondary">Jins filtri (erkak/ayol/hamma)</Text>
                <Select
                  value={form.gender}
                  onChange={(v) => setForm((p) => ({ ...p, gender: v }))}
                  options={GENDER_OPTIONS}
                  style={{ width: "100%", marginTop: 6 }}
                  size="large"
                />
              </Col>
            </Row>

            <Divider />

            <Title level={5} style={{ marginTop: 0 }}>Topilgan e’lonlar</Title>

            {errorText ? (
              <Result status="error" title="Xatolik" subTitle={errorText} />
            ) : results.length === 0 ? (
              <Result icon={<CarOutlined />} title="Hozircha mos e’lon topilmadi" subTitle="Filtrlarni o‘zgartiring yoki keyinroq qayta qidiring." />
            ) : (
              <Space direction="vertical" style={{ width: "100%" }} size={12}>
                {results.map((order) => {
                  const sched = order.scheduled_at ? dayjs(order.scheduled_at) : null;
                  return (
                    <Card key={order.id} style={{ borderRadius: 16, border: "1px solid #f0f0f0" }}>
                      <Row gutter={12} align="middle">
                        <Col xs={24} md={16}>
                          <Space direction="vertical" size={4}>
                            <Title level={5} style={{ margin: 0 }}>
                              <EnvironmentFilled style={{ color: "#1890ff", marginRight: 8 }} />
                              {routeText(order)}
                            </Title>

                            <Space size={16} wrap>
                              <Text><CalendarOutlined /> <b>{sched ? sched.format("YYYY-MM-DD") : "-"}</b></Text>
                              <Text><ClockCircleOutlined /> <b>{sched ? sched.format("HH:mm") : "-"}</b></Text>
                              <Text><UserOutlined /> <b>{order.seats_available ?? "-"}</b> / {order.seats_total ?? "-"} joy</Text>
                              <Text><b>{formatMoney(order.price)}</b> so‘m</Text>
                            </Space>

                            <Space size={10} wrap style={{ marginTop: 4 }}>
                              <Tag color={order.pickup_mode === "home_pickup" ? "purple" : "blue"}>
                                {order.pickup_mode === "home_pickup" ? "Uydan olib ketish" : "Belgilangan joyga kelish"}
                              </Tag>
                              {order.meet_address ? <Tag>Ketish: {order.meet_address}</Tag> : null}
                              {order.dest_address ? <Tag>Manzil: {order.dest_address}</Tag> : null}
                              {order.meet_lat != null && order.meet_lng != null ? (
                                <Button size="small" onClick={() => openMapEmbed({ title: "Xarita", lat: order.meet_lat, lng: order.meet_lng, mode: "pin" })}>Ketish xarita</Button>
                              ) : null}
                            </Space>
                          </Space>
                        </Col>

                        <Col xs={24} md={8}>
                          <Button type="primary" block size="large" icon={<CheckCircleOutlined />} onClick={() => openBooking(order)} style={{ borderRadius: 14, height: 44 }}>
                            Joy band qilish so‘rovi
                          </Button>
                        </Col>
                      </Row>
                    </Card>
                  );
                })}
              </Space>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card style={{ borderRadius: 18, border: "none", boxShadow: "0 6px 20px rgba(0,0,0,0.06)" }}>
            <Title level={5} style={{ marginTop: 0 }}>Mening so‘rovlarim</Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              * “requested” holatda siz joyni tahrirlashingiz yoki bekor qilishingiz mumkin. Haydovchi qabul qilgach “accepted” bo‘ladi.
            </Text>

            <Divider />

            {myLoading ? (
              <Skeleton active paragraph={{ rows: 8 }} />
            ) : myBookings.length === 0 ? (
              <Result status="info" title="Hozircha so‘rovlar yo‘q" subTitle="E’lon topib “Joy band qilish so‘rovi” yuboring." />
            ) : (
              <List
                dataSource={myBookings}
                renderItem={(b) => {
                  const st = statusLabel(b.status);
                  const o = b.orders || {};
                  return (
                    <List.Item
                      actions={[
                        b.status === "requested" ? (
                          <Button key="edit" icon={<EditOutlined />} onClick={() => openEditBooking(b)}>
                            Tahrirlash
                          </Button>
                        ) : null,
                        b.status === "requested" ? (
                          <Button key="cancel" danger icon={<CloseCircleOutlined />} onClick={() => cancelBooking(b)}>
                            Bekor qilish
                          </Button>
                        ) : null,
                        b.status === "accepted" && o.meet_lat != null && o.meet_lng != null ? (
                          <Button key="meet" onClick={() => openMapEmbed({ title: "Yo‘l", lat: o.meet_lat, lng: o.meet_lng, sLat: null, sLng: null, mode: "route" })}>Ketish joyiga yo‘l</Button>
                        ) : null,
                      ].filter(Boolean)}
                    >
                      <List.Item.Meta
                        title={
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                            <Tag color={st.color}>{st.text}</Tag>
                            <Tag color="blue">{b.seats} ta joy</Tag>
                          </div>
                        }
                        description={
                          <div>
                            <div style={{ fontWeight: 600 }}>{routeText(o)}</div>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              So‘rov: {dayjs(b.created_at).format("YYYY-MM-DD HH:mm")}
                            </Text>

                            {b.status === "accepted" ? (
                              <div style={{ marginTop: 6 }}>
                                <Text type="secondary">Kommentariya: </Text>
                                <b>Haydovchi qabul qildi, tez orada bog‘laning.</b>
                              </div>
                            ) : null}

                            {b.status === "accepted" && o.pickup_mode === "home_pickup" && b.pickup_address ? (
                              <div style={{ marginTop: 6 }}>
                                <Tag color="purple">Sizning uy manzilingiz</Tag> <b>{b.pickup_address}</b>
                              </div>
                            ) : null}
                          </div>
                        }
                      />
                    </List.Item>
                  );
                }}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* Booking request modal */}
      <Modal
        title="Joy band qilish so‘rovi"
        open={bookingModalOpen}
        onCancel={() => setBookingModalOpen(false)}
        onOk={confirmBookingRequest}
        okText="So‘rov yuborish"
      >
        {!selectedOrder ? null : (
          <div>
            <Tag color="purple" style={{ marginBottom: 8 }}>{routeText(selectedOrder)}</Tag>
            <div style={{ marginBottom: 10 }}>
              <Text type="secondary">Hozirgi qolgan joy:</Text> <b>{selectedOrder.seats_available ?? "-"}</b>
            </div>

            <Divider />

            <Text type="secondary">Ism familiya (avtomat to‘ladi, o‘zgartirish mumkin)</Text>
            <Input value={passengerName} onChange={(e) => setPassengerName(e.target.value)} placeholder="Masalan: Abdiev Timur" style={{ marginTop: 6, marginBottom: 12 }} />

            <Text type="secondary">Telefon raqam (avtomat to‘ladi, o‘zgartirish mumkin)</Text>
            <Input value={passengerPhone} onChange={(e) => setPassengerPhone(e.target.value)} placeholder="+998..." style={{ marginTop: 6, marginBottom: 12 }} />

            <Text type="secondary">Jins (avtomat, o‘zgartirish mumkin)</Text>
            <Select value={passengerGender} onChange={setPassengerGender} options={GENDER_OPTIONS} style={{ width: "100%", marginTop: 6, marginBottom: 12 }} />

            <Text type="secondary">Nechta joy so‘raysiz?</Text>
            <InputNumber min={1} max={Number(selectedOrder.seats_available || 1)} value={bookingSeats} onChange={(v) => setBookingSeats(Number(v || 1))} style={{ width: "100%", marginTop: 6 }} />

            <Divider />

            <Text type="secondary">Olib ketish turi</Text>
            <Select
              value={deliveryType}
              onChange={(v) => setDeliveryType(v)}
              style={{ width: "100%", marginTop: 6 }}
              size="large"
              options={[
                { value: "meet_point", label: "Belgilangan joyga kelish" },
                { value: "home_pickup", label: "Uydan olib ketish" },
              ]}
            />

            {deliveryType === "meet_point" ? (
              <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 10 }}>
                * Haydovchi belgilagan ketish joyiga borasiz. (Agar haydovchi meet-point qo‘ygan bo‘lsa, xaritada ko‘rish mumkin.)
              </Text>
            ) : (
              <>
                <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 10 }}>
                  * Uydan olib ketish uchun lokatsiyangiz kerak. Haydovchi faqat qabul qilgandan keyin ko‘radi.
                </Text>

                <Space style={{ marginTop: 10 }} wrap>
                  <Button
                    icon={<AimOutlined />}
                    onClick={async () => {
                      try {
                        const p = await getMyGeo();
                        setPickupLat(p.lat);
                        setPickupLng(p.lng);
                        message.success("Lokatsiya olindi");
                      } catch (e) {
                        message.error("Lokatsiyani olishda xatolik");
                      }
                    }}
                  >
                    Geolokatsiyadan olish
                  </Button>

                  {pickupLat != null && pickupLng != null ? (
                    <>
                      <Button onClick={() => openMapEmbed({ title: "Xarita", lat: pickupLat, lng: pickupLng, mode: "pin" })}>Xarita</Button>
                      <Button type="primary" onClick={() => openMapEmbed({ title: "Yo‘l", lat: pickupLat, lng: pickupLng, sLat: null, sLng: null, mode: "route" })}>Yo‘l</Button>
                    </>
                  ) : null}
                </Space>

                <Input
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  placeholder="Uy manzili (ixtiyoriy, masalan: Sergeli, 5-mavze)"
                  style={{ marginTop: 10 }}
                />
              </>
            )}

            <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 10 }}>
              * Bu yerda “so‘rov” yuboriladi. Haydovchi qabul qilmaguncha zakaz avtomatik qabul bo‘lib ketmaydi.
            </Text>
          </div>
        )}
      </Modal>

      {/* Edit booking modal */}
      <Modal
        title="So‘rovni tahrirlash"
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        onOk={saveEditBookingSeats}
        okText="Saqlash"
      >
        {!editBooking ? null : (
          <div>
            {editBooking.status !== "requested" ? (
              <Text type="secondary" style={{ fontSize: 12 }}>
                * So‘rov qabul qilingan. Endi faqat joylar sonini o‘zgartirish mumkin. (Bekor qilish mumkin)
              </Text>
            ) : (
              <Text type="secondary" style={{ fontSize: 12 }}>
                * “requested” holatda telefon/ism/jins va joylar sonini tahrirlash mumkin.
              </Text>
            )}

            <Divider />

            <Text type="secondary">Ism familiya</Text>
            <Input value={editName} onChange={(e) => setEditName(e.target.value)} disabled={editBooking.status !== "requested"} style={{ marginTop: 6, marginBottom: 12 }} />

            <Text type="secondary">Telefon</Text>
            <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} disabled={editBooking.status !== "requested"} style={{ marginTop: 6, marginBottom: 12 }} />

            <Text type="secondary">Jins</Text>
            <Select value={editGender} onChange={setEditGender} options={GENDER_OPTIONS} disabled={editBooking.status !== "requested"} style={{ width: "100%", marginTop: 6, marginBottom: 12 }} />

            <Text type="secondary">Nechta joy?</Text>
            <InputNumber min={1} max={20} value={editSeats} onChange={(v) => setEditSeats(Number(v || 1))} style={{ width: "100%", marginTop: 6 }} />

            <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 10 }}>
              * Joy ko‘paytirsangiz tizimda joy yetarliligi tekshiriladi.
            </Text>
          </div>
        )}
      </Modal>

      <LocationPickerModal
        open={pickModal.open}
        title="Uy manzilini xaritadan tanlang"
        initialCenter={pickModal.center}
        onCancel={() => setPickModal({ open: false, center: null })}
        onSelect={({ lat, lng, address }) => {
          setPickupLat(lat);
          setPickupLng(lng);
          if (address) setPickupAddress(address);
          setPickModal({ open: false, center: null });
        }}
      />

      <Modal
        title={mapModal.title}
        open={mapModal.open}
        onCancel={() => setMapModal({ open: false, url: "", title: "Xarita" })}
        footer={null}
        width={900}
        style={{ top: 24 }}
      >
        {mapModal.url ? (
          <iframe
            title="map"
            src={mapModal.url}
            style={{ width: "100%", height: 520, border: 0, borderRadius: 12 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : null}
      </Modal>

    </div>
  );
}
