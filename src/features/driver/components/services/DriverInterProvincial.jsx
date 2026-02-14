import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  Card,
  Button,
  Typography,
  Row,
  Col,
  TimePicker,
  DatePicker,
  InputNumber,
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
  Switch,
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
  
  // Driver current location (auto)
  const [driverGeo, setDriverGeo] = useState({ lat: null, lng: null, ts: 0 });
  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setDriverGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude, ts: Date.now() });
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Map picker modal (YandexGo style: center pin, move map)
  const [pickerModal, setPickerModal] = useState({ open: false, target: "meet" });
  const [pickerState, setPickerState] = useState({ lat: null, lng: null, address: "" });
  const pickerMapRef = useRef(null);
  const leafletRef = useRef({ L: null, map: null, markerEl: null });

const [mapModal, setMapModal] = useState({ open: false, url: "", title: "Xarita" });
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

  // --- Leaflet loader (no npm) + YandexGo-like picker ---
  const loadLeaflet = async () => {
    if (leafletRef.current.L) return leafletRef.current.L;
    // load css
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    // load js
    await new Promise((resolve, reject) => {
      if (window.L) return resolve();
      const s = document.createElement("script");
      s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      s.async = true;
      s.onload = resolve;
      s.onerror = reject;
      document.body.appendChild(s);
    });
    leafletRef.current.L = window.L;
    return window.L;
  };

  const reverseGeocodeOSM = async (lat, lng) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${encodeURIComponent(
        lat
      )}&lon=${encodeURIComponent(lng)}&format=json&zoom=18&addressdetails=1`;
      const res = await fetch(url, { headers: { "Accept": "application/json" } });
      const js = await res.json();
      return js?.display_name || "";
    } catch {
      return "";
    }
  };

  useEffect(() => {
    const run = async () => {
      if (!pickerModal.open) return;

      const L = await loadLeaflet();

      // initial center
      const initLat = pickerState.lat ?? driverGeo.lat ?? meetLat ?? 41.311081;
      const initLng = pickerState.lng ?? driverGeo.lng ?? meetLng ?? 69.240562;

      // destroy old map
      try {
        if (leafletRef.current.map) {
          leafletRef.current.map.remove();
          leafletRef.current.map = null;
        }
      } catch {}

      const map = L.map(pickerMapRef.current, {
        center: [initLat, initLng],
        zoom: 15,
        zoomControl: true,
      });

      leafletRef.current.map = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap",
      }).addTo(map);

      // center pin overlay (not draggable)
      const pin = document.createElement("div");
      pin.style.position = "absolute";
      pin.style.left = "50%";
      pin.style.top = "50%";
      pin.style.transform = "translate(-50%, -100%)";
      pin.style.zIndex = "999";
      pin.style.width = "26px";
      pin.style.height = "26px";
      pin.style.borderRadius = "50%";
      pin.style.background = "rgba(255, 193, 7, 0.95)";
      pin.style.boxShadow = "0 8px 20px rgba(0,0,0,0.35)";
      pin.style.border = "2px solid rgba(0,0,0,0.25)";
      pin.title = "Markaz";
      leafletRef.current.markerEl = pin;

      const wrap = pickerMapRef.current?.parentElement;
      if (wrap && !wrap.querySelector(".center-pin")) {
        pin.className = "center-pin";
        wrap.style.position = "relative";
        wrap.appendChild(pin);
      }

      let timer = null;
      const updateCenter = async () => {
        const c = map.getCenter();
        const lat = +c.lat.toFixed(6);
        const lng = +c.lng.toFixed(6);
        setPickerState((p) => ({ ...p, lat, lng }));
        const addr = await reverseGeocodeOSM(lat, lng);
        setPickerState((p) => ({ ...p, address: addr || p.address }));
      };

      // initial
      await updateCenter();

      map.on("moveend", () => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(updateCenter, 250);
      });
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickerModal.open]);

  const openPickupPicker = async () => {
    try {
      // Prefer current geolocation as start
      let base = null;
      try {
        base = await getMyGeo();
      } catch {
        base = null;
      }
      if (base?.lat && base?.lng) {
        setPickerState({ lat: base.lat, lng: base.lng, address: "" });
      } else {
        setPickerState({ lat: meetLat ?? null, lng: meetLng ?? null, address: meetAddress || "" });
      }
      setPickerModal({ open: true, target: "meet" });
    } catch (e) {
      console.error(e);
      message.error("Lokatsiya oynasini ochib bo‘lmadi");
    }
  };

  const applyPickerToMeet = () => {
    if (!pickerState.lat || !pickerState.lng) {
      message.error("Lokatsiya tanlanmadi");
      return;
    }
    setMeetLat(pickerState.lat);
    setMeetLng(pickerState.lng);
    setMeetAddress(pickerState.address || "");
    setPickerModal({ open: false, target: "meet" });
    message.success("Ketish joyi tanlandi");
  };

  const applyPickerToDest = () => {
    if (!pickerState.lat || !pickerState.lng) {
      message.error("Lokatsiya tanlanmadi");
      return;
    }
    setDestLat(pickerState.lat);
    setDestLng(pickerState.lng);
    setDestAddress(pickerState.address || "");
    setPickerModal({ open: false, target: "dest" });
    message.success("Manzil tanlandi");
  };



  const [loading, setLoading] = useState(true);
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
  const [deliveryService, setDeliveryService] = useState(false); // eltish xizmati
  const [meetLat, setMeetLat] = useState(null);
  const [meetLng, setMeetLng] = useState(null);
  const [meetAddress, setMeetAddress] = useState("");
  const [destLat, setDestLat] = useState(null);
  const [destLng, setDestLng] = useState(null);
  const [destAddress, setDestAddress] = useState("");

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
    setDeliveryService(!!o.delivery_service);
    setMeetLat(o.meet_lat ?? null);
    setMeetLng(o.meet_lng ?? null);
    setMeetAddress(o.meet_address || "");
    setDestLat(o.dest_lat ?? null);
    setDestLng(o.dest_lng ?? null);
    setDestAddress(o.dest_address || "");
  };

  const loadDriverData = async () => {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    if (!user) {
      setActiveAd(null);
      setRequests([]);
      setAccepted([]);
      setNotifications([]);
      setDriverBalance(null);
      return;
    }

    const bal = await loadDriverBalance(user.id);
    setDriverBalance(bal);

    const { data: ad, error: adErr } = await supabase
      .from("orders")
      .select("*")
      .eq("driver_id", user.id)
      .eq("service_type", "inter_prov")
      .in("status", ["pending", "booked"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (adErr) {
      // no active ad
      setActiveAd(null);
      setRequests([]);
      setAccepted([]);
    } else {
      setActiveAd(ad);
      fillFormFromActive(ad);

      const { data: reqs } = await supabase
        .from("trip_booking_requests")
        .select("*")
        .eq("order_id", ad.id)
        .eq("status", "requested")
        .order("created_at", { ascending: false });
      // Auto-expire requests older than 2 hours (if not accepted)
      try {
        const now = Date.now();
        const expiredIds = (reqs || [])
          .filter((r) => r?.created_at && now - new Date(r.created_at).getTime() > 2 * 60 * 60 * 1000)
          .map((r) => r.id);
        if (expiredIds.length) {
          await supabase
            .from("trip_booking_requests")
            .update({ status: "expired", updated_at: new Date().toISOString() })
            .in("id", expiredIds)
            .eq("status", "requested");
        }
      } catch {}


      const { data: accs } = await supabase
        .from("trip_booking_requests")
        .select("*")
        .eq("driver_id", user.id)
        .eq("order_id", ad.id)
        .eq("status", "accepted")
        .order("updated_at", { ascending: false });

      setRequests(reqs || []);
      setAccepted(accs || []);
    }

    try {
      const nots = await loadNotifications(user.id);
      setNotifications(nots);
    } catch (e) {}
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
            .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (payload) => {
              const row = payload?.new || payload?.old;
              if (!row) return;
              if (row.driver_id === user.id) loadDriverData();
            })
            .on("postgres_changes", { event: "*", schema: "public", table: "trip_booking_requests" }, (payload) => {
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
    if (!validate()) return;

    setSubmitting(true);
    try {
      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr) throw authErr;
      const user = authData?.user;
      if (!user) return message.error("Avval login qiling");

      if (ACCEPT_FEE_SUM > 0) {
        const bal = Number(driverBalance ?? 0);
        if (!Number.isFinite(bal) || bal < ACCEPT_FEE_SUM) {
          return message.error(`Balans yetarli emas. Qabul qilish narxi: ${ACCEPT_FEE_SUM} so‘m`);
        }
      }

      const scheduledAtObj = dayjs(`${formData.date} ${formData.time}`, "YYYY-MM-DD HH:mm");

      if (scheduledAtObj.isBefore(dayjs(), 'day') || scheduledAtObj.isBefore(dayjs(), 'minute')) {
        message.error("Ketish vaqti o'tgan bo'lishi mumkin emas!");
        setSubmitting(false);
        return;
      }

      const scheduledAt = scheduledAtObj.toISOString();

      const payload = {
        driver_id: user.id,
        client_id: null,
        service_type: "inter_prov",
        status: "pending",

        from_region: formData.fromRegion,
        from_district: (formData.fromDistrict || "").trim(),
        to_region: formData.toRegion,
        to_district: (formData.toDistrict || "").trim(),

        scheduled_at: scheduledAt,
        seats_total: formData.seatsTotal,
        seats_available: formData.seatsTotal,

        pickup_location: `${formData.fromRegion}, ${districtLabel(formData.fromDistrict)}`,
        dropoff_location: `${formData.toRegion}, ${districtLabel(formData.toDistrict)}`,
        price: formData.price,
        gender_pref: normalizeGender(formData.genderPref),

        pickup_mode: pickupMode,
        delivery_service: deliveryService,
        meet_lat: meetLat,
        meet_lng: meetLng,
        meet_address: meetAddress || null,
        dest_lat: destLat,
        dest_lng: destLng,
        dest_address: (destAddress || null),
      };

      const { data, error } = await supabase.from("orders").insert(payload).select("*").maybeSingle();
      if (error) throw error;

      setActiveAd(data);
      setRequests([]);
      setAccepted([]);
      setEditMode(false);
      message.success("E’lon yaratildi!");
    } catch (e) {
      console.error(e);
      message.error(e?.message || "Xatolik!");
    } finally {
      setSubmitting(false);
    }
  };

  const saveEdits = async () => {
    if (!activeAd) return;
    if (!validate()) return;

    setSubmitting(true);
    try {
      const scheduledAtObj = dayjs(`${formData.date} ${formData.time}`, "YYYY-MM-DD HH:mm");

      if (scheduledAtObj.isBefore(dayjs(), 'day') || scheduledAtObj.isBefore(dayjs(), 'minute')) {
        message.error("Ketish vaqti o'tgan bo'lishi mumkin emas!");
        setSubmitting(false);
        return;
      }

      const scheduledAt = scheduledAtObj.toISOString();

      const hasRequestsOrAccepted = requests.length + accepted.length > 0;
      const seatsPatch = hasRequestsOrAccepted ? {} : { seats_total: formData.seatsTotal, seats_available: formData.seatsTotal };

      const patch = {
        from_region: formData.fromRegion,
        from_district: (formData.fromDistrict || "").trim(),
        to_region: formData.toRegion,
        to_district: (formData.toDistrict || "").trim(),
        scheduled_at: scheduledAt,
        price: formData.price,
        gender_pref: normalizeGender(formData.genderPref),
        pickup_mode: pickupMode,
        delivery_service: deliveryService,
        meet_lat: meetLat,
        meet_lng: meetLng,
        meet_address: meetAddress || null,
        dest_lat: destLat,
        dest_lng: destLng,
        dest_address: (destAddress || null),
        pickup_location: `${formData.fromRegion}, ${districtLabel(formData.fromDistrict)}`,
        dropoff_location: `${formData.toRegion}, ${districtLabel(formData.toDistrict)}`,
        ...seatsPatch,
      };

      const { data, error } = await supabase.from("orders").update(patch).eq("id", activeAd.id).select("*").maybeSingle();
      if (error) throw error;

      setActiveAd(data);
      setEditMode(false);

      // optional notify
      try {
        await supabase.from("notifications").insert({
          user_id: data.driver_id,
          type: "order_updated",
          title: "E’lon yangilandi",
          body: `Yangilandi: ${routeText(data)}`,
          order_id: data.id,
        });
      } catch (e) {}

      message.success("Saqlangan!");
    } catch (e) {
      console.error(e);
      message.error(e?.message || "Saqlashda xatolik!");
    } finally {
      setSubmitting(false);
    }
  };

  const cancelAd = async () => {
    if (!activeAd) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("orders").update({ status: "cancelled" }).eq("id", activeAd.id);
      if (error) throw error;

      setActiveAd(null);
      setRequests([]);
      setAccepted([]);
      setEditMode(false);
      message.success("E’lon bekor qilindi.");
    } catch (e) {
      console.error(e);
      message.error(e?.message || "Xatolik!");
    } finally {
      setSubmitting(false);
    }
  };

  const finishTrip = async () => {
    if (!activeAd) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", activeAd.id);
      if (error) throw error;

      message.success("Safar yakunlandi (manzilga yetib keldik). Yangi buyurtma berishingiz mumkin.");
      // keep draft for quick re-create
      setActiveAd(null);
      setRequests([]);
      setAccepted([]);
      setEditMode(false);
    } catch (e) {
      console.error(e);
      message.error(e?.message || "Safarni yakunlashda xatolik!");
    } finally {
      setSubmitting(false);
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
    if (!activeAd) return;
    setSubmitting(true);
    try {
      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr) throw authErr;
      const user = authData?.user;
      if (!user) return message.error("Avval login qiling");

      if (ACCEPT_FEE_SUM > 0) {
        const bal = Number(driverBalance ?? 0);
        if (!Number.isFinite(bal) || bal < ACCEPT_FEE_SUM) {
          return message.error(`Balans yetarli emas. Qabul qilish narxi: ${ACCEPT_FEE_SUM} so‘m`);
        }
      }

      const { error } = await supabase
        .from("trip_booking_requests")
        .update({
          status: "accepted",
          driver_id: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", bookingId)
        .eq("status", "requested");
      if (error) throw error;

      // Decrement seats_available in orders (best-effort, with optimistic lock)
      try {
        const orderId = activeAd.id;
        const { data: curOrder, error: oErr } = await supabase
          .from("orders")
          .select("id,seats_available,seats_total,status")
          .eq("id", orderId)
          .maybeSingle();
        if (oErr) throw oErr;

        const curSeats = Number(curOrder?.seats_available ?? 0);
        if (curSeats > 0) {
          const nextSeats = curSeats - 1;
          const nextStatus = nextSeats <= 0 ? "full" : (curOrder?.status || "pending");

          const { data: updOrder, error: uErr } = await supabase
            .from("orders")
            .update({ seats_available: nextSeats, status: nextStatus })
            .eq("id", orderId)
            .eq("seats_available", curSeats)
            .select("*")
            .maybeSingle();

          if (!uErr && updOrder) {
            setActiveAd(updOrder);
          }
        }
      } catch (eSeats) {
        console.warn("seats decrement failed", eSeats);
      }

      message.success("So‘rov qabul qilindi. Telefon endi ko‘rinadi.");
      await loadDriverData();
    } catch (e) {
      console.error(e);
      message.error(e?.message || "Qabul qilishda xatolik!");
    } finally {
      setSubmitting(false);
    }
  };

  const rejectRequest = async (bookingId) => {
    if (!activeAd) return;
    setSubmitting(true);
    try {
      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr) throw authErr;
      const user = authData?.user;
      if (!user) return message.error("Avval login qiling");

      if (ACCEPT_FEE_SUM > 0) {
        const bal = Number(driverBalance ?? 0);
        if (!Number.isFinite(bal) || bal < ACCEPT_FEE_SUM) {
          return message.error(`Balans yetarli emas. Qabul qilish narxi: ${ACCEPT_FEE_SUM} so‘m`);
        }
      }

      const { error } = await supabase
        .from("trip_booking_requests")
        .update({
          status: "rejected",
          driver_id: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", bookingId)
        .eq("status", "requested");
      if (error) throw error;

      message.success("So‘rov rad etildi. Joy qaytarildi.");
      await loadDriverData();
    } catch (e) {
      console.error(e);
      message.error(e?.message || "Rad etishda xatolik!");
    } finally {
      setSubmitting(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (loading) {
    const isAdFull = Number(activeAd?.seats_available ?? 0) <= 0 || activeAd?.status === "full";

  return (
      <div style={{ padding: 16 }}>
        <Skeleton active paragraph={{ rows: 12 }} />
      </div>
    );
  }

  const isAdFull = Number(activeAd?.seats_available ?? 0) <= 0 || activeAd?.status === "full";

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

      <Modal
        title="Ketish joyini xaritadan tanlash"
        open={pickerModal.open}
        onCancel={() => setPickerModal({ open: false, target: "meet" })}
        footer={null}
        width="100%"
        style={{ top: 0, padding: 0 }}
        bodyStyle={{ padding: 0, height: "calc(100vh - 55px)" }}
        centered
      >
        <div style={{ position: "relative", width: "100%", height: "calc(100vh - 55px)" }}>
          <div ref={pickerMapRef} style={{ width: "100%", height: "100%" }} />
          <div
            style={{
              position: "absolute",
              left: 12,
              right: 12,
              bottom: 12,
              padding: 12,
              borderRadius: 12,
              background: "rgba(0,0,0,0.55)",
              backdropFilter: "blur(10px)",
              color: "white",
            }}
          >
            <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 6 }}>
              Xaritani siljiting — o‘rtadagi belgi turgan joy tanlanadi
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
              {pickerState.address || "Manzil aniqlanmoqda..."}
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Button onClick={() => setPickerModal({ open: false, target: pickerModal.target })}>Bekor</Button>
              <Button
                type="primary"
                onClick={() => {
                  if (pickerModal.target === "dest") applyPickerToDest();
                  else applyPickerToMeet();
                }}
              >
                Tanlash
              </Button>
            </div>
          </div>
        </div>
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
                  {!isAdFull ? (
                    <>

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
                
                    </>
                  ) : (
                    <>
                      <Button
                        type="primary"
                        block
                        size="large"
                        icon={<SendOutlined />}
                        onClick={() => {
                          // Hide full ad and allow creating a new one
                          setActiveAd(null);
                          setRequests([]);
                          setAccepted([]);
                          setEditMode(false);
                          setTab("requests");
                          message.info("Yangi e’lon yaratishingiz mumkin");
                        }}
                        style={{ borderRadius: 14, height: 44 }}
                      >
                        Yangi buyurtma berish
                      </Button>
                    </>
                  )}
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
                    <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10 }}>
                      <Switch checked={deliveryService} onChange={(v) => setDeliveryService(!!v)} />
                      <Text style={{ fontWeight: 600 }}>Eltish xizmati</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        (belgilansa yo‘lovchi tomonda “Eltish xizmati” bo‘limida chiqadi)
                      </Text>
                    </div>
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
                            const addr = await reverseGeocodeOSM(p.lat, p.lng);
                            if (addr) setMeetAddress(addr);
                            message.success("Ketish joyi lokatsiyasi olindi");
                          } catch (e) {
                            message.error("Lokatsiyani olishda xatolik");
                          }
                        }}
                      >
                        Geolokatsiyadan olish
                      </Button>

                      <Button onClick={openPickupPicker}>Xaritadan tanlash</Button>

                      {meetLat != null && meetLng != null ? (
                        <Button onClick={() => openMapEmbed({ title: "Ketish joyi", lat: meetLat, lng: meetLng, mode: "pin" })}>
                          Ko‘rish
                        </Button>
                      ) : null}
                    </Space>
                    <Input value={meetAddress} onChange={(e) => setMeetAddress(e.target.value)} placeholder="Masalan: Nukus avtovokzal" style={{ marginTop: 8 }} />
                  </Col>
                </Row>

                <Divider />

                <Row gutter={12}>
                  <Col xs={24} md={12}>
                    <Text type="secondary">Borish lokatsiyasi shart emas</Text>
                    <div style={{ marginTop: 8, opacity: 0.85, fontSize: 12 }}>
                      Boradigan joy viloyat/tuman orqali aniqlanadi. Lokatsiya koordinatasi kiritish shart emas.
                    </div>
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
                                <div
                                  key="acceptWrap"
                                  style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4 }}
                                >
                                  <Button
                                    type="primary"
                                    icon={<CheckOutlined />}
                                    loading={submitting}
                                    onClick={() => acceptRequest(b.id)}
                                  >
                                    Qabul qilish
                                  </Button>
                                  <span style={{ fontSize: 11, opacity: 0.8 }}>
                                    (Qabul qilsangiz hisobingizdan {ACCEPT_FEE_SUM.toLocaleString()} so‘m yechiladi)
                                  </span>
                                </div>,
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
                                    {b.pickup_lat != null && b.pickup_lng != null ? (
                                      <Button size="small" onClick={() => openMapEmbed({ title: "Yo‘lovchi manzili", lat: b.pickup_lat, lng: b.pickup_lng, mode: "pin" })}>
                                        Yo‘lovchi manzili
                                      </Button>
                                    ) : null}
                                  </div>
                                }
                                description={
                                  <div>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                      Qabul qilingan: {dayjs(b.updated_at || b.created_at).format("YYYY-MM-DD HH:mm")}
                                    </Text>

                                    {b.pickup_address ? (
                                      <div style={{ marginTop: 6 }}>
                                        <Tag color="purple">Uy manzili</Tag> <b style={{ cursor: "pointer" }} onClick={() => openMapEmbed({ title: "Yo‘l", lat: b.pickup_lat, lng: b.pickup_lng, sLat: driverGeo.lat, sLng: driverGeo.lng, mode: "route" })}>{b.pickup_address}</b>
                                        <div style={{ marginTop: 8 }}>
                                          <Button size="small" onClick={() => openMapEmbed({ title: "Yo‘l", lat: b.pickup_lat, lng: b.pickup_lng, sLat: driverGeo.lat, sLng: driverGeo.lng, mode: "route" })}>
                                            Navigator (yo‘l ko‘rsatish)
                                          </Button>
                                        </div>
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
                      // Open map picker to choose destination
                      try {
                        await ensurePickerReady();
                        setPickerModal({ open: true, target: "dest" });
                        // if we already have coords, set picker center to them
                        if (destLat != null && destLng != null) {
                          setTimeout(() => {
                            try {
                              leafletRef.current?.map?.setView?.([destLat, destLng], 15);
                            } catch {}
                          }, 200);
                        }
                      } catch (e) {
                        message.error("Xaritani ochib bo‘lmadi");
                      }
                    }}
                  >
                    Xaritadan tanlash
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
