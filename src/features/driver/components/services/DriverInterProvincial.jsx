import React, { useMemo, useState, useEffect } from "react";
import {
  Card,
  Button,
  Typography,
  Row,
  Col,
  TimePicker,
  DatePicker,
  InputNumber,
  Switch,
  Space,
  message,
  ConfigProvider,
  Divider,
  Select,
  Tag,
  Skeleton,
  List,
  Modal,
  Input,
  Badge,
  Tabs,
} from "antd";
import {
  ArrowLeftOutlined,
  EnvironmentFilled,
  ClockCircleOutlined,
  CalendarOutlined,
  UserOutlined,
  DeleteOutlined,
  SendOutlined,
  EditOutlined,
  BellOutlined,
  SaveOutlined,
  CheckOutlined,
  CloseOutlined,
  EyeInvisibleOutlined,
  AimOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { translations } from "@i18n/translations";
import { supabase } from "../../../../lib/supabase";

const { Title, Text } = Typography;

/**
 * DriverInterProvincial.jsx (v5 - fixed & working)
 * - Driver creates inter_prov ad (order)
 * - Driver sees own active ad after re-login
 * - Passenger booking requests come as "requested"
 * - Driver must Accept/Reject
 * - After accept: passenger phone visible + "Yo‘lovchi bilan bog‘laning" comment
 * - Optional pickup mode:
 *    - meet_point: passenger comes to driver's meet point
 *    - home_pickup: passenger sends pickup geolocation; driver sees it after accept
 * - Driver can set:
 *    - meet point (start) via geolocation + address text
 *    - destination (label + optional geo) via geolocation + address text
 *
 * NOTE:
 * - This file expects DB tables:
 *   orders, trip_booking_requests, trip_bookings, notifications
 * - RPCs used (expected to exist):
 *   accept_inter_prov_booking, reject_inter_prov_booking
 * - Wallet/balance is optional; if table not present it will just show nothing.
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

const PICKUP_MODES = [
  { label: "Belgilangan joyga kelish", value: "meet_point" },
  { label: "Uydan olib ketish", value: "home_pickup" },
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


const maskPhone = (p) => {
  const s = String(p || "");
  if (s.length < 6) return "********";
  return s.slice(0, 4) + "****" + s.slice(-2);
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

async function loadNotifications(userId) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data || [];
}

async function markNotifRead(ids) {
  if (!ids || ids.length === 0) return;
  await supabase.from("notifications").update({ is_read: true }).in("id", ids);
}

async function loadDriverBalance(driverId) {
  // optional table. If absent - ignore.
  try {
    const { data, error } = await supabase
      .from("driver_wallets")
      .select("balance")
      .eq("driver_id", driverId)
      .maybeSingle();
    if (!error && data) return Number(data.balance || 0);
  } catch (e) {}
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("balance")
      .eq("id", driverId)
      .maybeSingle();
    if (!error && data) return Number(data.balance || 0);
  } catch (e) {}
  return null;
}

export default function DriverInterProvincial({ onBack }) {
  const savedLang = localStorage.getItem("appLang") || "uz_lotin";
  const t = translations?.[savedLang] || translations?.["uz_lotin"] || {};


  // In-app map modal (no new tab)
  const [mapModal, setMapModal] = useState({ open: false, url: "", title: "Xarita" });
  const [meetPickModal, setMeetPickModal] = useState({ open: false, center: null });
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
  const [acceptingIds, setAcceptingIds] = useState(() => new Set());
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState("");

  const [activeAd, setActiveAd] = useState(null);
  const [tab, setTab] = useState("requests");

  const [requests, setRequests] = useState([]); // status=requested
  const [accepted, setAccepted] = useState([]); // status=accepted

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const [editMode, setEditMode] = useState(false);
  const [driverBalance, setDriverBalance] = useState(null);

  // Accept fee (UZS). For now 0 so'm => everyone can accept.
  const ACCEPT_FEE_SUM = 0;

  // pickup/destination extra
  const [pickupMode, setPickupMode] = useState("meet_point"); // meet_point | home_pickup
  const [meetLat, setMeetLat] = useState(null);
  const [meetLng, setMeetLng] = useState(null);
  const [meetAddress, setMeetAddress] = useState("");
  const [destLat, setDestLat] = useState(null);
  const [destLng, setDestLng] = useState(null);
  const [destAddress, setDestAddress] = useState("");

  const [deliveryService, setDeliveryService] = useState(false);

  // Swap direction to quickly create a "return" ride draft
  const prepareReturnDraft = () => {
    // swap regions/districts
    setFormData((p) => ({
      ...p,
      fromRegion: p.toRegion,
      fromDistrict: p.toDistrict,
      toRegion: p.fromRegion,
      toDistrict: p.fromDistrict,
    }));

    // swap meet/destination pins
    setMeetLat(destLat);
    setMeetLng(destLng);
    setMeetAddress(destAddress || "");

    setDestLat(meetLat);
    setDestLng(meetLng);
    setDestAddress(meetAddress || "");

    setEditMode(true);
    message.success("Qaytish yo‘nalishi uchun draft tayyorlandi");
  };


  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem("driverInterProvDraft_v5");
    if (saved) {
      try {
        const p = JSON.parse(saved);
        return {
          fromRegion: p.fromRegion || "Qoraqalpog'iston",
          fromDistrict: p.fromDistrict ?? "Nukus sh.",
          toRegion: p.toRegion || "Toshkent shahri",
          toDistrict: p.toDistrict ?? "",
          date: p.date || dayjs().format("YYYY-MM-DD"),
          time: p.time || "09:00",
          seatsTotal: Number(p.seatsTotal || 4),
          price: Number(p.price || 150000),
          genderPref: normalizeGender(p.genderPref || p.gender_pref || "all"),
          pickupMode: p.pickupMode || p.pickup_mode || "meet_point",
        };
      } catch (e) {}
    }
    return {
      fromRegion: "Qoraqalpog'iston",
      fromDistrict: "Nukus sh.",
      toRegion: "Toshkent shahri",
      toDistrict: "",
      date: dayjs().format("YYYY-MM-DD"),
      time: "09:00",
      seatsTotal: 4,
      price: 150000,
      genderPref: "all",
      pickupMode: "meet_point",
    };
  });

  const fromDistricts = useMemo(() => {
    const list = getDistricts(formData.fromRegion);
    return isTashkentCity(formData.fromRegion) ? ["", ...list.filter((x) => x !== "")] : list;
  }, [formData.fromRegion]);

  const toDistricts = useMemo(() => {
    const list = getDistricts(formData.toRegion);
    return isTashkentCity(formData.toRegion) ? ["", ...list.filter((x) => x !== "")] : list;
  }, [formData.toRegion]);

  const validate = () => {
    if (!formData.fromRegion || !formData.fromRegion.trim()) return message.error("Qayerdan viloyatini tanlang!"), false;
    if (!isTashkentCity(formData.fromRegion) && (!formData.fromDistrict || !formData.fromDistrict.trim()))
      return message.error("Qayerdan tumanini tanlang!"), false;

    if (!formData.toRegion || !formData.toRegion.trim()) return message.error("Qayerga viloyatini tanlang!"), false;
    if (!isTashkentCity(formData.toRegion) && (!formData.toDistrict || !formData.toDistrict.trim()))
      return message.error("Qayerga tumanini tanlang!"), false;

    if (formData.fromRegion === formData.toRegion && (formData.fromDistrict || "") === (formData.toDistrict || ""))
      return message.error("Qayerdan va qayerga bir xil bo‘lmasin!"), false;

    if (!formData.date || !formData.time) return message.error("Sana va vaqtni tanlang!"), false;

    if (!formData.seatsTotal || formData.seatsTotal < 1) return message.error("O‘rindiqlar soni kamida 1 bo‘lsin!"), false;

    if (!formData.price || formData.price < 1000) return message.error("Narxni to‘g‘ri kiriting!"), false;

    if (pickupMode === "meet_point" && meetLat == null && meetAddress.trim() === "") {
      // allow no geo, but recommend
      // no hard error
    }
    return true;
  };

  const persistDraft = () => {
    localStorage.setItem("driverInterProvDraft_v5", JSON.stringify({ ...formData }));
  };

  const fillFormFromActive = (o) => {
    if (!o) return;
    const sched = o.scheduled_at ? dayjs(o.scheduled_at) : null;
    setFormData({
      fromRegion: o.from_region || "Qoraqalpog'iston",
      fromDistrict: o.from_district ?? "",
      toRegion: o.to_region || "Toshkent shahri",
      toDistrict: o.to_district ?? "",
      date: sched ? sched.format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"),
      time: sched ? sched.format("HH:mm") : "09:00",
      seatsTotal: Number(o.seats_total || 4),
      price: Number(o.price || 150000),
    });

    setPickupMode(o.pickup_mode || "meet_point");
    setMeetLat(o.meet_lat ?? null);
    setMeetLng(o.meet_lng ?? null);
    setMeetAddress(o.meet_address || "");
    setDestLat(o.dest_lat ?? null);
    setDestLng(o.dest_lng ?? null);
    setDestAddress(o.dest_address || "");
    setDeliveryService(!!o.delivery_service);
  };

  const loadDriverData = async () => {
try {
  setLoading(true);

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr) throw userErr;

  if (!user) {
    setActiveAd(null);
    setRequests([]);
    setAccepted([]);
    return;
  }

  // 1) Active ride
  const { data: ride, error: rideErr } = await supabase
    .from("inter_prov_rides")
    .select("*")
    .eq("driver_id", user.id)
    .in("status", ["open", "active"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (rideErr) throw rideErr;

  if (!ride) {
    setActiveAd(null);
    setRequests([]);
    setAccepted([]);
    return;
  }

  // 2) Fetch bookings for this ride
  const { data: bookings, error: bErr } = await supabase
    .from("inter_prov_bookings")
    .select("*")
    .eq("ride_id", ride.id)
    .order("created_at", { ascending: false });

  if (bErr) throw bErr;

  const req = (bookings || []).filter((b) => b.status === "requested" || b.status === "pending");
  const acc = (bookings || []).filter((b) => b.status === "accepted");

  const acceptedSeats = acc.reduce((sum, b) => sum + Number(b.seats || 0), 0);
  const seats_total = Number(ride.seats || 0);
  const seats_available = Math.max(0, seats_total - acceptedSeats);

  const scheduled_at = ride.ride_date && ride.ride_time ? `${ride.ride_date}T${ride.ride_time}` : null;

  // Keep UI compatibility with previous fields
  setActiveAd({
    ...ride,
    seats_total,
    seats_available,
    scheduled_at,
    service_type: "inter_prov",
    delivery_service: false,
  });

  setRequests(req);
  setAccepted(acc);
} catch (e) {
  console.error("loadDriverData error:", e);
  setActiveAd(null);
  setRequests([]);
  setAccepted([]);
} finally {
  setLoading(false);
}
};

  useEffect(() => {
    let isMounted = true;
    let channel = null;

    const init = async () => {
      try {
        setLoading(true);
        setErrorText("");
        await loadDriverData();

        const { data: authData } = await supabase.auth.getUser();
        const user = authData?.user;

        if (user && isMounted) {
          channel = supabase
            .channel("driver-interprov-live")
            .on("postgres_changes", { event: "*", schema: "public", table: "inter_prov_rides" }, (payload) => {
              const row = payload?.new || payload?.old;
              if (!row) return;
              if (row.driver_id === user.id) loadDriverData();
            })
            .on("postgres_changes", { event: "*", schema: "public", table: "inter_prov_bookings" }, (payload) => {
              const row = payload?.new || payload?.old;
              if (!row) return;
              if (row.driver_id === user.id) loadDriverData();
            })
            .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, (payload) => {
              const row = payload?.new || payload?.old;
              if (!row) return;
              if (row.user_id === user.id) loadDriverData();
            })
            .subscribe();
        }
      } catch (e) {
        console.error("DriverInterProvincial init error:", e);
        if (isMounted) setErrorText(e?.message || "Xatolik yuz berdi");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    init();

    return () => {
      isMounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    persistDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]);

  const createAd = async () => {
try {
  setCreating(true);

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  if (!user) {
    alert("Avval tizimga kiring (login).");
    return;
  }

  const seatsTotal = Number(formData.seatsTotal || 0);
  if (!Number.isFinite(seatsTotal) || seatsTotal <= 0) {
    alert("O'rinlar soni noto‘g‘ri.");
    return;
  }

  const priceNum = Number(formData.price || 0);
  if (!Number.isFinite(priceNum) || priceNum < 0) {
    alert("Narx noto‘g‘ri.");
    return;
  }

  // Map to inter_prov_rides schema
  const payload = {
    driver_id: user.id,
    from_region: formData.fromRegion || null,
    from_district: formData.fromDistrict || null,
    to_region: formData.toRegion || null,
    to_district: formData.toDistrict || null,
    pickup_location: formData.pickupLocation || null,
    dropoff_location: formData.dropoffLocation || null,
    pickup_mode: formData.pickupMode || "meet_point",
    meet_lat: formData.meetLat ?? null,
    meet_lng: formData.meetLng ?? null,
    meet_address: formData.meetAddress || null,
    dest_lat: formData.destLat ?? null,
    dest_lng: formData.destLng ?? null,
    dest_address: formData.destAddress || null,
    seats: seatsTotal,
    price: Math.trunc(priceNum),
    ride_date: formData.date || null,
    ride_time: formData.time || null,
    status: "open",
  };

  const { data: ins, error } = await supabase.from("inter_prov_rides").insert(payload).select("*").single();
  if (error) throw error;

  // Compute UI fields to keep the rest of component unchanged
  const scheduled_at =
    payload.ride_date && payload.ride_time ? `${payload.ride_date}T${payload.ride_time}` : null;

  const uiAd = {
    ...ins,
    seats_total: payload.seats,
    seats_available: payload.seats, // will be recalculated on refresh
    scheduled_at,
    service_type: "inter_prov",
    delivery_service: false,
  };

  setActiveAd(uiAd);
  setEditMode(true);
  setShowCreate(false);

  await loadDriverData();
} catch (e) {
  console.error("createAd error:", e);
  alert(e?.message || "E'lon yaratishda xatolik.");
} finally {
  setCreating(false);
}
};

  const saveEdits = async () => {
try {
  if (!activeAd?.id) return;

  setSaving(true);

  const seatsTotal = Number(editForm.seatsTotal || 0);
  if (!Number.isFinite(seatsTotal) || seatsTotal <= 0) {
    alert("O'rinlar soni noto‘g‘ri.");
    return;
  }

  const priceNum = Number(editForm.price || 0);
  if (!Number.isFinite(priceNum) || priceNum < 0) {
    alert("Narx noto‘g‘ri.");
    return;
  }

  const payload = {
    from_region: editForm.fromRegion || null,
    from_district: editForm.fromDistrict || null,
    to_region: editForm.toRegion || null,
    to_district: editForm.toDistrict || null,
    pickup_location: editForm.pickupLocation || null,
    dropoff_location: editForm.dropoffLocation || null,
    pickup_mode: editForm.pickupMode || "meet_point",
    meet_lat: editForm.meetLat ?? null,
    meet_lng: editForm.meetLng ?? null,
    meet_address: editForm.meetAddress || null,
    dest_lat: editForm.destLat ?? null,
    dest_lng: editForm.destLng ?? null,
    dest_address: editForm.destAddress || null,
    seats: seatsTotal,
    price: Math.trunc(priceNum),
    ride_date: editForm.date || null,
    ride_time: editForm.time || null,
    status: activeAd.status || "open",
  };

  const { data: upd, error } = await supabase
    .from("inter_prov_rides")
    .update(payload)
    .eq("id", activeAd.id)
    .select("*")
    .single();

  if (error) throw error;

  const scheduled_at = payload.ride_date && payload.ride_time ? `${payload.ride_date}T${payload.ride_time}` : null;

  setActiveAd((prev) => ({
    ...prev,
    ...upd,
    seats_total: payload.seats,
    scheduled_at,
  }));

  await loadDriverData();
  setEditMode(false);
} catch (e) {
  console.error("saveEdits error:", e);
  alert(e?.message || "Saqlashda xatolik.");
} finally {
  setSaving(false);
}
};

  const cancelAd = async () => {
try {
  if (!activeAd?.id) return;

  if (!confirm("E'lonni yopmoqchimisiz?")) return;

  setCancelling(true);

  // Prefer RPC if exists, else update status directly
  const { error: rpcErr } = await supabase.rpc("cancel_booking", { p_ride_id: activeAd.id });

  if (rpcErr) {
    const { error } = await supabase.from("inter_prov_rides").update({ status: "cancelled" }).eq("id", activeAd.id);
    if (error) throw error;

    // Also cancel pending bookings
    await supabase.from("inter_prov_bookings").update({ status: "cancelled" }).eq("ride_id", activeAd.id);
  }

  setActiveAd(null);
  setRequests([]);
  setAccepted([]);
} catch (e) {
  console.error("cancelAd error:", e);
  alert(e?.message || "Bekor qilishda xatolik.");
} finally {
  setCancelling(false);
}
};

  const finishTrip = async () => {
try {
  if (!activeAd?.id) return;

  if (!confirm("Safarni yakunlash (yopish)ni xohlaysizmi?")) return;

  setFinishing(true);

  const { error } = await supabase.from("inter_prov_rides").update({ status: "closed" }).eq("id", activeAd.id);
  if (error) throw error;

  setActiveAd(null);
  setRequests([]);
  setAccepted([]);
} catch (e) {
  console.error("finishTrip error:", e);
  alert(e?.message || "Yakunlashda xatolik.");
} finally {
  setFinishing(false);
}
};

  const openNotifications = async () => {
    setNotifOpen(true);
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    await markNotifRead(unreadIds);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (user?.id) {
        const nots2 = await loadNotifications(user.id);
        setNotifications(nots2);
      }
    } catch (e) {}
  };

  const acceptRequest = async (bookingId) => {
try {
  if (!req?.id) return;

  setActionLoading((prev) => ({ ...prev, [req.id]: true }));

  // Try RPC first (recommended to enforce seat checks)
  let rpcOk = false;

  const { error: rpcErr1 } = await supabase.rpc("accept_inter_prov_booking", { p_booking_id: req.id });
  if (!rpcErr1) rpcOk = true;

  if (!rpcOk) {
    const { error: rpcErr2 } = await supabase.rpc("accept_booking_request_v2", { p_booking_id: req.id });
    if (!rpcErr2) rpcOk = true;
  }

  if (!rpcOk) {
    const { error } = await supabase
      .from("inter_prov_bookings")
      .update({ status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", req.id);
    if (error) throw error;
  }

  await loadDriverData();
} catch (e) {
  console.error("acceptRequest error:", e);
  alert(e?.message || "Qabul qilishda xatolik.");
} finally {
  setActionLoading((prev) => ({ ...prev, [req?.id]: false }));
}
};

  const rejectRequest = async (bookingId) => {
try {
  if (!req?.id) return;

  setActionLoading((prev) => ({ ...prev, [req.id]: true }));

  let rpcOk = false;

  const { error: rpcErr1 } = await supabase.rpc("reject_inter_prov_booking", { p_booking_id: req.id });
  if (!rpcErr1) rpcOk = true;

  if (!rpcOk) {
    const { error: rpcErr2 } = await supabase.rpc("reject_booking_request", { p_booking_id: req.id });
    if (!rpcErr2) rpcOk = true;
  }

  if (!rpcOk) {
    const { error } = await supabase.from("inter_prov_bookings").update({ status: "rejected" }).eq("id", req.id);
    if (error) throw error;
  }

  await loadDriverData();
} catch (e) {
  console.error("rejectRequest error:", e);
  alert(e?.message || "Rad etishda xatolik.");
} finally {
  setActionLoading((prev) => ({ ...prev, [req?.id]: false }));
}
};

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (loading) {
    return (
      <div style={{ padding: 16 }}>
        <Skeleton active paragraph={{ rows: 12 }} />
      </div>
    );
  }

  return (
    <ConfigProvider theme={{ token: { colorPrimary: "#1890ff", borderRadius: 12 } }}>
      <div style={{ padding: 16, maxWidth: 980, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Button icon={<ArrowLeftOutlined />} onClick={onBack} shape="circle" />
            <div>
              <Title level={4} style={{ margin: 0 }}>Tumanlar/Viloyatlar aro — Haydovchi</Title>
              <Text type="secondary">service_type: <b>inter_prov</b></Text>
              {driverBalance !== null ? (
                <div>
                  <Text type="secondary">Balans: </Text><b>{formatMoney(driverBalance)} so‘m</b>
                </div>
              ) : null}
              {errorText ? <div><Text type="danger">{errorText}</Text></div> : null}
            </div>
          </div>

          <Badge count={unreadCount} overflowCount={99}>
            <Button icon={<BellOutlined />} onClick={openNotifications}>Bildirishnomalar</Button>
          </Badge>
        </div>

        <Modal title="Bildirishnomalar" open={notifOpen} onCancel={() => setNotifOpen(false)} footer={null}>
          {notifications.length === 0 ? (
            <Text type="secondary">Hozircha bildirishnoma yo‘q.</Text>
          ) : (
            <List
              dataSource={notifications}
              renderItem={(n) => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <Tag color={n.is_read ? "default" : "blue"}>{n.type}</Tag>
                        <span style={{ fontWeight: 600 }}>{n.title}</span>
                      </div>
                    }
                    description={
                      <div>
                        <div>{n.body}</div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {dayjs(n.created_at).format("YYYY-MM-DD HH:mm")}
                        </Text>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Modal>

      <LocationPickerModal
        open={meetPickModal.open}
        title="Ketish joyini xaritadan tanlang"
        initialCenter={meetPickModal.center}
        onCancel={() => setMeetPickModal({ open: false, center: null })}
        onSelect={({ lat, lng, address }) => {
          setMeetLat(lat);
          setMeetLng(lng);
          if (address) setMeetAddress(address);
          setMeetPickModal({ open: false, center: null });
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


        {/* Active Ad */}
        {activeAd ? (
          <Card style={{ borderRadius: 18, border: "none", boxShadow: "0 6px 20px rgba(0,0,0,0.06)" }}>
            <Row gutter={12} align="middle">
              <Col xs={24} md={16}>
                <Space direction="vertical" size={6} style={{ width: "100%" }}>
                  <Text type="secondary">Aktiv e’lon</Text>
                  <Title level={5} style={{ margin: 0 }}>
                    <EnvironmentFilled style={{ marginRight: 8, color: "#1890ff" }} />
                    {routeText(activeAd)}
                  </Title>

                  <Space size={16} wrap>
                    <Text><CalendarOutlined /> <b>{activeAd.scheduled_at ? dayjs(activeAd.scheduled_at).format("YYYY-MM-DD") : "-"}</b></Text>
                    <Text><ClockCircleOutlined /> <b>{activeAd.scheduled_at ? dayjs(activeAd.scheduled_at).format("HH:mm") : "-"}</b></Text>
                    <Text><UserOutlined /> <b>{activeAd.seats_available ?? "-"}</b> / {activeAd.seats_total ?? "-"} joy</Text>
                    <Text><b>{formatMoney(activeAd.price)}</b> so‘m</Text>
                  </Space>

                  <Space size={10} wrap style={{ marginTop: 6 }}>
                    <Tag color={activeAd.status === "pending" ? "green" : "gold"} style={{ padding: "4px 10px", borderRadius: 999 }}>
                      {activeAd.status === "pending" ? "Ochiq" : "Joylar band qilinmoqda"}
                    </Tag>
                    <Tag color={activeAd.pickup_mode === "home_pickup" ? "purple" : "blue"} style={{ padding: "4px 10px", borderRadius: 999 }}>
                      {activeAd.pickup_mode === "home_pickup" ? "Uydan olib ketish" : "Belgilangan joyga kelish"}
                    </Tag>
                    {Number(activeAd.seats_available || 0) <= 0 ? (
                      <Tag color="red" style={{ padding: "4px 10px", borderRadius: 999 }}>Joylar tugadi</Tag>
                    ) : null}
                  </Space>

                  {activeAd.meet_address ? (
                    <Text type="secondary">Ketish joyi: <b>{activeAd.meet_address}</b></Text>
                  ) : null}
                  {activeAd.dest_address ? (
                    <Text type="secondary">Manzil: <b>{activeAd.dest_address}</b></Text>
                  ) : null}
                </Space>
              </Col>

              <Col xs={24} md={8}>
                <Space direction="vertical" style={{ width: "100%" }} size={10}>
                  <Button
                    icon={<EditOutlined />}
                    block
                    size="large"
                    onClick={() => setEditMode((p) => !p)}
                    style={{ borderRadius: 14, height: 44 }}
                  >
                    {editMode ? "Tahrirni yopish" : "E’lonni tahrirlash"}
                  </Button>

                  <Button
                    danger
                    type="primary"
                    icon={<DeleteOutlined />}
                    block
                    size="large"
                    onClick={cancelAd}
                    loading={submitting}
                    style={{ borderRadius: 14, height: 44 }}
                  >
                    E’lonni bekor qilish
                  </Button>

                  {(Number(activeAd.seats_available || 0) <= 0 || activeAd.status === "booked") ? (
                    <Button
                      type="primary"
                      icon={<CheckOutlined />}
                      block
                      size="large"
                      onClick={finishTrip}
                      loading={submitting}
                      style={{ borderRadius: 14, height: 44 }}
                    >
                      Manzilga yetib keldik
                    </Button>
                  ) : null}

                  <Button
                    block
                    size="large"
                    onClick={prepareReturnDraft}
                    style={{ borderRadius: 14, height: 44 }}
                  >
                    Qaytish e’loni uchun yo‘nalishni almashtirish
                  </Button>
                </Space>
              </Col>
            </Row>

            {editMode ? (
              <div style={{ marginTop: 16 }}>
                <Divider orientation="left">Tahrirlash</Divider>

                <Row gutter={12}>
                  <Col xs={24} md={12}>
                    <Text type="secondary">Qayerdan viloyat</Text>
                    <Select value={formData.fromRegion} onChange={(v) => setFormData((p) => ({ ...p, fromRegion: v, fromDistrict: isTashkentCity(v) ? "" : p.fromDistrict }))} style={{ width: "100%", marginTop: 6 }} size="large">
                      {REGIONS_DATA.map((r) => (
                        <Select.Option key={r.name} value={r.name}>{r.name}</Select.Option>
                      ))}
                    </Select>
                  </Col>
                  <Col xs={24} md={12}>
                    <Text type="secondary">Qayerdan tuman</Text>
                    <Select value={formData.fromDistrict} onChange={(v) => setFormData((p) => ({ ...p, fromDistrict: v }))} style={{ width: "100%", marginTop: 6 }} size="large">
                      {fromDistricts.map((d) => (
                        <Select.Option key={`${d}`} value={d}>{districtLabel(d)}</Select.Option>
                      ))}
                    </Select>
                    {isTashkentCity(formData.fromRegion) ? <Text type="secondary" style={{ fontSize: 12 }}>* Toshkent shahri uchun tumanni tanlamasa bo‘ladi.</Text> : null}
                  </Col>
                </Row>

                <Divider />

                <Row gutter={12}>
                  <Col xs={24} md={12}>
                    <Text type="secondary">Qayerga viloyat</Text>
                    <Select value={formData.toRegion} onChange={(v) => setFormData((p) => ({ ...p, toRegion: v, toDistrict: isTashkentCity(v) ? "" : p.toDistrict }))} style={{ width: "100%", marginTop: 6 }} size="large">
                      {REGIONS_DATA.map((r) => (
                        <Select.Option key={r.name} value={r.name}>{r.name}</Select.Option>
                      ))}
                    </Select>
                  </Col>
                  <Col xs={24} md={12}>
                    <Text type="secondary">Qayerga tuman</Text>
                    <Select value={formData.toDistrict} onChange={(v) => setFormData((p) => ({ ...p, toDistrict: v }))} style={{ width: "100%", marginTop: 6 }} size="large">
                      {toDistricts.map((d) => (
                        <Select.Option key={`${d}`} value={d}>{districtLabel(d)}</Select.Option>
                      ))}
                    </Select>
                    {isTashkentCity(formData.toRegion) ? <Text type="secondary" style={{ fontSize: 12 }}>* Toshkent shahri uchun tumanni tanlamasa bo‘ladi.</Text> : null}
                  </Col>
                </Row>

                <Divider />

                <Row gutter={12}>
                  <Col xs={24} md={12}>
                    <Text type="secondary">Sana</Text>
                    <DatePicker value={formData.date ? dayjs(formData.date) : null} disabledDate={(current) => current && current < dayjs().startOf("day")} onChange={(d) => setFormData((p) => ({ ...p, date: d ? d.format("YYYY-MM-DD") : "" }))} style={{ width: "100%", marginTop: 6 }} size="large" />
                  </Col>
                  <Col xs={24} md={12}>
                    <Text type="secondary">Vaqt</Text>
                    <TimePicker value={dayjs(formData.time, "HH:mm")} disabledTime={() => {
                      const isToday = formData.date === dayjs().format("YYYY-MM-DD");
                      if (!isToday) return {};
                      const now = dayjs();
                      const disabledHours = () => Array.from({ length: now.hour() }, (_, i) => i);
                      const disabledMinutes = (selectedHour) => {
                        if (selectedHour !== now.hour()) return [];
                        return Array.from({ length: now.minute() }, (_, i) => i);
                      };
                      return { disabledHours, disabledMinutes };
                    }} onChange={(tVal) => setFormData((p) => ({ ...p, time: tVal ? tVal.format("HH:mm") : "" }))} format="HH:mm" style={{ width: "100%", marginTop: 6 }} size="large" />
                  </Col>
                </Row>

                <Divider />

                <Row gutter={12}>
                  <Col xs={24} md={12}>
                    <Text type="secondary">Narx (so‘m)</Text>
                    <InputNumber min={1000} step={1000} value={formData.price} onChange={(v) => setFormData((p) => ({ ...p, price: Number(v || 0) }))} style={{ width: "100%", marginTop: 6 }} size="large" />
                  </Col>
                  <Col xs={24} md={12}>
                    <Text type="secondary">O‘rindiqlar (so‘rovlar bo‘lsa bloklanadi)</Text>
                    <InputNumber min={1} max={20} value={formData.seatsTotal} onChange={(v) => setFormData((p) => ({ ...p, seatsTotal: Number(v || 1) }))} style={{ width: "100%", marginTop: 6 }} size="large" disabled={(requests.length + accepted.length) > 0} />
                    {(requests.length + accepted.length) > 0 ? <Text type="secondary" style={{ fontSize: 12 }}>* So‘rovlar bor: o‘rindiqlar sonini o‘zgartirib bo‘lmaydi.</Text> : null}
                  </Col>
                </Row>

                <Divider />

                <Row gutter={12}>
                  <Col xs={24} md={12}>
                    <Text type="secondary">Yo‘lovchi jinsi</Text>
                    <Select
                      value={formData.genderPref}
                      onChange={(v) => setFormData((p) => ({ ...p, genderPref: v }))}
                      style={{ width: "100%", marginTop: 6 }}
                      size="large"
                      options={GENDER_OPTIONS}
                    />
                    <Text type="secondary" style={{ fontSize: 12 }}>* Kimlar uchun: erkak/ayol/hamma.</Text>
                  </Col>
                  <Col xs={24} md={12}>
                    <Text type="secondary">Olib ketish turi</Text>
                    <Select
                      value={pickupMode}
                      style={{ width: "100%", marginTop: 6 }}
                      size="large"
                      onChange={(v) => setPickupMode(v)}
                      options={[
                        { value: "meet_point", label: "Belgilangan joyga kelish" },
                        { value: "home_pickup", label: "Uydan olib ketish" },
                      ]}
                    />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {pickupMode === "home_pickup"
                        ? "* Yo‘lovchi so‘rov yuborganda uy lokatsiyasini yuboradi, siz acceptdan keyin ko‘rasiz."
                        : "* Yo‘lovchi siz belgilagan ketish joyiga keladi."}
                    </Text>

                    <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10 }}>
                      <Switch checked={deliveryService} onChange={(v) => setDeliveryService(v)} />
                      <Text strong>Eltish xizmati</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>* Belgilansa yo‘lovchi tomonda “Eltish xizmati” bo‘limida chiqadi.</Text>
                    </div>
                  </Col>
                  <Col xs={24} md={12}>
                    <Text type="secondary">Ketish joyi (meet point)</Text>
                    <Space style={{ width: "100%", marginTop: 6 }} wrap>
                      <Button
                        icon={<AimOutlined />}
                        onClick={async () => {
                          try {
                            const p = await getMyGeo();
                            setMeetLat(p.lat);
                            setMeetLng(p.lng);
                            message.success("Ketish joyi lokatsiyasi olindi");
                          } catch (e) {
                            message.error("Lokatsiyani olishda xatolik");
                          }
                        }}
                      >
                        Geolokatsiya
                      </Button>
                      {meetLat != null && meetLng != null ? (
                        <>
                          <Button onClick={() => openMapEmbed({ title: "Xarita", lat: meetLat, lng: meetLng, mode: "pin" })}>Xarita</Button>
                          <Button onClick={() => openMapEmbed({ title: "Yo‘l", lat: meetLat, lng: meetLng, sLat: meetLat, sLng: meetLng, mode: "route" })}>Yo‘l</Button>
                        </>
                      ) : null}
                    </Space>
                    <Row gutter={8} style={{ marginTop: 8 }}>
                      <Col xs={12}>
                        <Input
                          value={meetLat ?? ""}
                          onChange={(e) => setMeetLat(e.target.value === "" ? null : Number(e.target.value))}
                          placeholder="Lat (masalan: 42.46)"
                        />
                      </Col>
                      <Col xs={12}>
                        <Input
                          value={meetLng ?? ""}
                          onChange={(e) => setMeetLng(e.target.value === "" ? null : Number(e.target.value))}
                          placeholder="Lng (masalan: 59.61)"
                        />
                      </Col>
                    </Row>
                    <Input value={meetAddress} onChange={(e) => setMeetAddress(e.target.value)} placeholder="Masalan: Nukus avtovokzal" style={{ marginTop: 8 }} />
                  </Col>
                </Row>

                <Divider />

                <Row gutter={12}>
                  <Col xs={24} md={12}>
                    <Text type="secondary">Borish lokatsiyasi shart emas</Text>
                    <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 6 }}>
                      * Boradigan joy yuqorida (viloyat/tuman) bilan ma’lum. Lokatsiya belgilash kerak emas.
                    </Text>
                  </Col>
                  <Col xs={24} md={12}>
                    <Button type="primary" size="large" block icon={<SaveOutlined />} onClick={saveEdits} loading={submitting} style={{ borderRadius: 14, height: 48, marginTop: 24 }}>
                      Saqlash
                    </Button>
                  </Col>
                </Row>
              </div>
            ) : null}

            <Divider />

            <Tabs
              activeKey={tab}
              onChange={setTab}
              items={[
                {
                  key: "requests",
                  label: `So‘rovlar (${requests.length})`,
                  children: (
                    <>
                      {requests.length === 0 ? (
                        <Text type="secondary">Hozircha bron so‘rovlari yo‘q.</Text>
                      ) : (
                        <List
                          dataSource={requests}
                          itemLayout="horizontal"
                          renderItem={(b) => (
                            <List.Item
                              actions={[
                                <Button key="accept" type="primary" icon={<CheckOutlined />} loading={submitting} onClick={() => acceptRequest(b.id)}>
                                  Qabul qilish
                                </Button>,
                                <Button key="reject" danger icon={<CloseOutlined />} loading={submitting} onClick={() => rejectRequest(b.id)}>
                                  Rad etish
                                </Button>,
                              ]}
                            >
                              <List.Item.Meta
                                title={
                                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                                    <Tag color="blue">{b.seats} ta joy</Tag>
                                    <span style={{ fontWeight: 600 }}>{b.passenger_name || "Yo‘lovchi"}</span>
                                    <Tag icon={<EyeInvisibleOutlined />}>Telefon: {maskPhone(b.passenger_phone)}</Tag>
                                  </div>
                                }
                                description={
                                  <div>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                      So‘rov vaqti: {dayjs(b.created_at).format("YYYY-MM-DD HH:mm")}
                                    </Text>

                                    {/* Home pickup data may already exist, but we keep it hidden until accept.
                                        If you want to show address as masked before accept, do it here. */}
                                  </div>
                                }
                              />
                            </List.Item>
                          )}
                        />
                      )}
                    </>
                  ),
                },
                {
                  key: "accepted",
                  label: `Qabul qilinganlar (${accepted.length})`,
                  children: (
                    <>
                      {accepted.length === 0 ? (
                        <Text type="secondary">Hozircha qabul qilingan bronlar yo‘q.</Text>
                      ) : (
                        <List
                          dataSource={accepted}
                          itemLayout="horizontal"
                          renderItem={(b) => (
                            <List.Item
                              actions={[
                                b.pickup_lat != null && b.pickup_lng != null ? (
                                  <Button key="map" onClick={() => openMapEmbed({ title: "Xarita", lat: b.pickup_lat, lng: b.pickup_lng, mode: "pin" })}>Xarita</Button>
                                ) : null,
                                b.pickup_lat != null && b.pickup_lng != null ? (
                                  <Button key="route" type="primary" onClick={() => openMapEmbed({ title: "Yo‘l", lat: b.pickup_lat, lng: b.pickup_lng, sLat: meetLat, sLng: meetLng, mode: "route" })}>Yo‘l</Button>
                                ) : null,
                              ].filter(Boolean)}
                            >
                              <List.Item.Meta
                                title={
                                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                                    <Tag color="green">{b.seats} ta joy</Tag>
                                    <span style={{ fontWeight: 600 }}>{b.passenger_name || "Yo‘lovchi"}</span>
                                    <Tag color="geekblue">Telefon: <b>{b.passenger_phone || "-"}</b></Tag>
                                  </div>
                                }
                                description={
                                  <div>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                      Qabul qilingan: {dayjs(b.updated_at || b.created_at).format("YYYY-MM-DD HH:mm")}
                                    </Text>

                                    {b.pickup_address ? (
                                      <div style={{ marginTop: 6 }}>
                                        <Tag color="purple">Uy manzili</Tag> <b>{b.pickup_address}</b>
                                      </div>
                                    ) : null}

                                    <div style={{ marginTop: 6 }}>
                                      <Text type="secondary">Kommentariya: </Text>
                                      <b>Yo‘lovchi bilan bog‘laning</b>
                                    </div>
                                  </div>
                                }
                              />
                            </List.Item>
                          )}
                        />
                      )}
                    </>
                  ),
                },
              ]}
            />
          </Card>
        ) : (
          <Card style={{ borderRadius: 18, border: "none", boxShadow: "0 6px 20px rgba(0,0,0,0.06)" }}>
            <Title level={5} style={{ marginTop: 0 }}>Yangi e’lon yaratish</Title>

            <Divider orientation="left">Qayerdan</Divider>
            <Row gutter={12}>
              <Col xs={24} md={12}>
                <Text type="secondary">Viloyat</Text>
                <Select value={formData.fromRegion} onChange={(v) => setFormData((p) => ({ ...p, fromRegion: v, fromDistrict: isTashkentCity(v) ? "" : p.fromDistrict }))} style={{ width: "100%", marginTop: 6 }} size="large">
                  {REGIONS_DATA.map((r) => (
                    <Select.Option key={r.name} value={r.name}>{r.name}</Select.Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} md={12}>
                <Text type="secondary">Tuman/Shahar</Text>
                <Select value={formData.fromDistrict} onChange={(v) => setFormData((p) => ({ ...p, fromDistrict: v }))} style={{ width: "100%", marginTop: 6 }} size="large">
                  {fromDistricts.map((d) => (
                    <Select.Option key={`${d}`} value={d}>{districtLabel(d)}</Select.Option>
                  ))}
                </Select>
                {isTashkentCity(formData.fromRegion) ? <Text type="secondary" style={{ fontSize: 12 }}>* Toshkent shahri uchun tumanni tanlamasa bo‘ladi.</Text> : null}
              </Col>
            </Row>

            <Divider orientation="left">Qayerga</Divider>
            <Row gutter={12}>
              <Col xs={24} md={12}>
                <Text type="secondary">Viloyat</Text>
                <Select value={formData.toRegion} onChange={(v) => setFormData((p) => ({ ...p, toRegion: v, toDistrict: isTashkentCity(v) ? "" : p.toDistrict }))} style={{ width: "100%", marginTop: 6 }} size="large">
                  {REGIONS_DATA.map((r) => (
                    <Select.Option key={r.name} value={r.name}>{r.name}</Select.Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} md={12}>
                <Text type="secondary">Tuman/Shahar</Text>
                <Select value={formData.toDistrict} onChange={(v) => setFormData((p) => ({ ...p, toDistrict: v }))} style={{ width: "100%", marginTop: 6 }} size="large">
                  {toDistricts.map((d) => (
                    <Select.Option key={`${d}`} value={d}>{districtLabel(d)}</Select.Option>
                  ))}
                </Select>
                {isTashkentCity(formData.toRegion) ? <Text type="secondary" style={{ fontSize: 12 }}>* Toshkent shahri uchun tumanni tanlamasa bo‘ladi.</Text> : null}
              </Col>
            </Row>

            <Divider />

            <Row gutter={12}>
              <Col xs={24} md={12}>
                <Text type="secondary">Sana</Text>
                <DatePicker value={formData.date ? dayjs(formData.date) : null} disabledDate={(current) => current && current < dayjs().startOf("day")} onChange={(d) => setFormData((p) => ({ ...p, date: d ? d.format("YYYY-MM-DD") : "" }))} style={{ width: "100%", marginTop: 6 }} size="large" />
              </Col>
              <Col xs={24} md={12}>
                <Text type="secondary">Vaqt</Text>
                <TimePicker value={dayjs(formData.time, "HH:mm")} disabledTime={() => {
                      const isToday = formData.date === dayjs().format("YYYY-MM-DD");
                      if (!isToday) return {};
                      const now = dayjs();
                      const disabledHours = () => Array.from({ length: now.hour() }, (_, i) => i);
                      const disabledMinutes = (selectedHour) => {
                        if (selectedHour !== now.hour()) return [];
                        return Array.from({ length: now.minute() }, (_, i) => i);
                      };
                      return { disabledHours, disabledMinutes };
                    }} onChange={(tVal) => setFormData((p) => ({ ...p, time: tVal ? tVal.format("HH:mm") : "" }))} format="HH:mm" style={{ width: "100%", marginTop: 6 }} size="large" />
              </Col>
            </Row>

            <Divider />

            <Row gutter={12}>
              <Col xs={24} md={12}>
                <Text type="secondary">Yo‘lovchi jinsi</Text>
                <Select
                  value={formData.genderPref}
                  onChange={(v) => setFormData((p) => ({ ...p, genderPref: v }))}
                  style={{ width: "100%", marginTop: 6 }}
                  size="large"
                  options={GENDER_OPTIONS}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>* Kimlar uchun: erkak/ayol/hamma.</Text>
              </Col>
              <Col xs={24} md={12}>
                <Text type="secondary">Olib ketish turi</Text>
                <Select
                  value={pickupMode}
                  onChange={setPickupMode}
                  style={{ width: "100%", marginTop: 6 }}
                  size="large"
                  options={PICKUP_MODES}
                />
              </Col>
            </Row>

            <Divider />

            <Row gutter={12}>
              <Col xs={24} md={12}>
                <Text type="secondary">O‘rindiqlar</Text>
                <InputNumber min={1} max={20} value={formData.seatsTotal} onChange={(v) => setFormData((p) => ({ ...p, seatsTotal: Number(v || 1) }))} style={{ width: "100%", marginTop: 6 }} size="large" />
              </Col>
              <Col xs={24} md={12}>
                <Text type="secondary">Narx (so‘m)</Text>
                <InputNumber min={1000} step={1000} value={formData.price} onChange={(v) => setFormData((p) => ({ ...p, price: Number(v || 0) }))} style={{ width: "100%", marginTop: 6 }} size="large" />
              </Col>
            </Row>

            <Divider />

            
<Divider />

            <Row gutter={12}>
              <Col xs={24} md={12}>
                <Text type="secondary">Ketish manzili (destination)</Text>
                <Space style={{ width: "100%", marginTop: 6 }} wrap>
                  <Button
                    icon={<AimOutlined />}
                    onClick={async () => {
                      try {
                        const p = await getMyGeo();
                        setDestLat(p.lat);
                        setDestLng(p.lng);
                        message.success("Manzil lokatsiyasi olindi");
                      } catch (e) {
                        message.error("Lokatsiyani olishda xatolik");
                      }
                    }}
                  >
                    Geolokatsiya
                  </Button>
                  {destLat != null && destLng != null ? (
                    <>
                      <Button onClick={() => openMapEmbed({ title: "Xarita", lat: destLat, lng: destLng, mode: "pin" })}>Xarita</Button>
                      <Button onClick={() => openMapEmbed({ title: "Yo‘l", lat: destLat, lng: destLng, sLat: meetLat, sLng: meetLng, mode: "route" })}>Yo‘l</Button>
                    </>
                  ) : null}
                </Space>
                <Input value={destAddress} onChange={(e) => setDestAddress(e.target.value)} placeholder="Masalan: Toshkent Markaziy Bozor" style={{ marginTop: 8 }} />
              </Col>
              <Col xs={24} md={12}>
                <Button type="primary" size="large" block icon={<SendOutlined />} onClick={createAd} loading={submitting} style={{ borderRadius: 14, height: 48, marginTop: 24 }}>
                  E’lonni yaratish
                </Button>
              </Col>
            </Row>
          </Card>
        )}
      </div>
    </ConfigProvider>
  );
}
