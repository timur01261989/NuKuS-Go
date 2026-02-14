import React, {useEffect, useMemo, useState, useRef} from "react";
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
  Switch,
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
  
  // Client current location (auto)
  const [clientGeo, setClientGeo] = useState({ lat: null, lng: null, ts: 0 });
  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setClientGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude, ts: Date.now() }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Map picker modal (center pin)
  const [pickerModal, setPickerModal] = useState({ open: false });
  const [pickerState, setPickerState] = useState({ lat: null, lng: null, address: "" });
  const pickerMapRef = useRef(null);
  const leafletRef = useRef({ L: null, map: null, markerEl: null });

  const [deliveryOnly, setDeliveryOnly] = useState(false); // Eltish xizmati filter
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
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
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
      const initLat = pickerState.lat ?? clientGeo.lat ?? pickupLat ?? 41.311081;
      const initLng = pickerState.lng ?? clientGeo.lng ?? pickupLng ?? 69.240562;

      try {
        if (leafletRef.current.map) {
          leafletRef.current.map.remove();
          leafletRef.current.map = null;
        }
      } catch {}

      const map = L.map(pickerMapRef.current, { center: [initLat, initLng], zoom: 15 });
      leafletRef.current.map = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap",
      }).addTo(map);

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
      pin.className = "center-pin";

      const wrap = pickerMapRef.current?.parentElement;
      if (wrap) {
        wrap.style.position = "relative";
        // remove previous
        const old = wrap.querySelector(".center-pin");
        if (old) old.remove();
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
    let base = null;
    try {
      base = await getMyGeo();
    } catch {
      base = null;
    }
    if (base?.lat && base?.lng) setPickerState({ lat: base.lat, lng: base.lng, address: "" });
    else setPickerState({ lat: pickupLat ?? null, lng: pickupLng ?? null, address: pickupAddress || "" });
    setPickerModal({ open: true });
  };

  const applyPickerToPickup = () => {
    if (!pickerState.lat || !pickerState.lng) {
      message.error("Lokatsiya tanlanmadi");
      return;
    }
    setPickupLat(pickerState.lat);
    setPickupLng(pickerState.lng);
    setPickupAddress(pickerState.address || pickupAddress);
    setPickerModal({ open: false });
    message.success("Uy manzili tanlandi");
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
    setMyLoading(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) {
        setMyBookings([]);
        return;
      }

      // auto-fill from meta if local storage empty
      const metaName = user?.user_metadata?.full_name || user?.user_metadata?.name || "";
      const metaPhone = user?.user_metadata?.phone || user?.phone || "";
      if (!localStorage.getItem("passenger_name") && metaName) localStorage.setItem("passenger_name", metaName);
      if (!localStorage.getItem("passenger_phone") && metaPhone) localStorage.setItem("passenger_phone", metaPhone);

      const { data, error } = await supabase
        .from("trip_booking_requests")
        .select("*, orders(*)")
        .eq("passenger_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMyBookings(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setMyLoading(false);
    }
  };

  const doSearch = async (silent = false) => {
    setSearching(true);
    setErrorText("");

    try {
      const fromDistrictFilter = (form.fromDistrict || "").trim();
      const toDistrictFilter = (form.toDistrict || "").trim();

      let q = supabase
        .from("orders")
        .select("*")
        .eq("service_type", "inter_prov")
        .in("status", ["pending", "booked"])
        .gt("seats_available", 0)
        .eq("from_region", form.fromRegion)
        // delivery service filter
        
        
        .eq("to_region", form.toRegion)
        .order("scheduled_at", { ascending: true });

      // gender filter (optional column gender_pref)
      if (form.gender && form.gender !== "all") {
        // show orders that allow everyone OR matching gender
        q = q.in("gender_pref", ["all", form.gender]);
      }

      // pickup mode filter
      if (form.pickupMode && form.pickupMode !== "all") {
        q = q.eq("pickup_mode", form.pickupMode);
      }

      // wildcard rules:
      // If passenger chose district, match exact OR driver wildcard (empty string)
      if (!isTashkentCity(form.fromRegion) || fromDistrictFilter) {
        q = q.or(`from_district.eq.${fromDistrictFilter},from_district.eq.`);
      }
      if (!isTashkentCity(form.toRegion) || toDistrictFilter) {
        q = q.or(`to_district.eq.${toDistrictFilter},to_district.eq.`);
      }

      if (form.date) {
        const start = dayjs(form.date).startOf("day").toISOString();
        const end = dayjs(form.date).endOf("day").toISOString();
        q = q.gte("scheduled_at", start).lte("scheduled_at", end);
      }

      let data, error;
      ({ data, error } = await q);
      if (error) {
        const msg = String(error.message || "");
        if (msg.toLowerCase().includes("gender") || msg.toLowerCase().includes("gender_pref") || msg.toLowerCase().includes("column")) {
          // fallback: column not migrated yet
          const fromDistrictFilter2 = (form.fromDistrict || "").trim();
          const toDistrictFilter2 = (form.toDistrict || "").trim();
          let q2 = supabase
            .from("orders")
            .select("*")
            .eq("service_type", "inter_prov")
            .in("status", ["pending", "booked"])
            .gt("seats_available", 0)
            .eq("from_region", form.fromRegion)
            .eq("to_region", form.toRegion)
            .order("scheduled_at", { ascending: true });
          if (!isTashkentCity(form.fromRegion) || fromDistrictFilter2) {
            q2 = q2.or(`from_district.eq.${fromDistrictFilter2},from_district.eq.`);
          }
          if (!isTashkentCity(form.toRegion) || toDistrictFilter2) {
            q2 = q2.or(`to_district.eq.${toDistrictFilter2},to_district.eq.`);
          }
          if (form.date) {
            const start = dayjs(form.date).startOf("day").toISOString();
            const end = dayjs(form.date).endOf("day").toISOString();
            q2 = q2.gte("scheduled_at", start).lte("scheduled_at", end);
          }
          ({ data, error } = await q2);
        }
      }
      if (error) throw error;

      const filtered = (data || []).filter((o) => Number(o.seats_available || 0) >= Number(form.minSeats || 1));
      setResults(filtered);

      if (!silent) message.success(`Topildi: ${filtered.length} ta e’lon`);
    } catch (e) {
      console.error(e);
      setResults([]);
      setErrorText(e?.message || "Qidiruvda xatolik!");
      if (!silent) message.error(e?.message || "Qidiruvda xatolik!");
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
            .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => doSearch(true))
            .on("postgres_changes", { event: "*", schema: "public", table: "trip_booking_requests" }, (payload) => {
              const row = payload?.new || payload?.old;
              if (!row) return;
              if (row.passenger_id === user.id || row.driver_id === user.id) loadMyBookings();
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
    setSelectedOrder(order);
    setBookingSeats(1);

    // fill from localStorage
    const savedName = localStorage.getItem("passenger_name") || "";
    const savedPhone = localStorage.getItem("passenger_phone") || "";
    const savedGender = localStorage.getItem("passenger_gender") || "all";
    setPassengerName(savedName);
    setPassengerPhone(savedPhone);
    setPassengerGender(normalizeGender(savedGender));

    // default deliveryType from order if exists
    setDeliveryType(order.pickup_mode || "meet_point");
    setPickupLat(null);
    setPickupLng(null);
    setPickupAddress("");

    setBookingModalOpen(true);
  };

  const confirmBookingRequest = async () => {
    try {
      if (!selectedOrder) return;

      const seatsReq = Number(bookingSeats || 1);
      if (seatsReq < 1) return message.error("Joylar soni kamida 1 bo‘lsin!");
      if (!passengerPhone.trim()) return message.error("Telefon raqamingizni kiriting!");

      if (deliveryType === "home_pickup") {
        if (pickupLat == null || pickupLng == null) return message.error("Uydan olib ketishga lokatsiya yuboring!");
      }

      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr) throw authErr;
      const user = authData?.user;
      if (!user) return message.error("So‘rov yuborish uchun avval tizimga kiring!");

      // save passenger info (auto next time)
      localStorage.setItem("passenger_name", passengerName);
      localStorage.setItem("passenger_phone", passengerPhone);
      localStorage.setItem("passenger_gender", passengerGender);

      // Prefer v2, fallback to v1
      let rpcErr = null;
      const v2 = await supabase.rpc("request_inter_prov_booking", {
        p_order_id: selectedOrder.id,
        p_passenger_id: user.id,
        p_passenger_name: passengerName || "",
        p_passenger_phone: passengerPhone,
        p_passenger_gender: normalizeGender(passengerGender),
        p_seats: seatsReq,
        p_pickup_lat: pickupLat,
        p_pickup_lng: pickupLng,
        p_pickup_address: pickupAddress,
      });

      if (v2?.error) {
        rpcErr = v2.error;
        const v1 = await supabase.rpc("request_inter_prov_booking", {
          p_order_id: selectedOrder.id,
          p_passenger_id: user.id,
          p_passenger_name: passengerName || "",
          p_passenger_phone: passengerPhone,
          p_seats: seatsReq,
        });
        if (v1?.error) throw v1.error;
      }

      message.success("So‘rov yuborildi! Haydovchi qabul qilsa telefon ko‘rinadi.");
      setBookingModalOpen(false);
      setSelectedOrder(null);

      await doSearch(true);
      await loadMyBookings();
    } catch (e) {
      console.error(e);
      message.error(e?.message || "So‘rov yuborishda xatolik!");
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
      if (!editBooking) return;

      const newSeats = Number(editSeats || 1);
      if (newSeats < 1) return message.error("Joy kamida 1 bo‘lsin!");

      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) return message.error("Avval tizimga kiring!");

      const canEditAll = editBooking.status === "requested";
      const v2Args = {
        p_request_id: editBooking.id,
        p_passenger_id: user.id,
        p_new_seats: newSeats,
        p_pickup_lat: pickupLat,
        p_pickup_lng: pickupLng,
        p_pickup_address: pickupAddress,
      };
      if (canEditAll) {
        v2Args.p_passenger_name = editName || "";
        v2Args.p_passenger_phone = editPhone || "";
        v2Args.p_passenger_gender = normalizeGender(editGender);
      }

      // prefer v2 edit
      const v2 = await supabase.rpc("edit_booking_request", v2Args);

      if (v2?.error) {
        // fallback old seats-only rpc
        const v1 = await supabase.rpc("update_inter_prov_booking_seats", {
          p_booking_id: editBooking.id,
          p_passenger_id: user.id,
          p_new_seats: newSeats,
        });
        if (v1?.error) throw v1.error;
      }

      message.success("So‘rov yangilandi!");
      setEditModalOpen(false);
      setEditBooking(null);

      await doSearch(true);
      await loadMyBookings();
    } catch (e) {
      console.error(e);
      message.error(e?.message || "Tahrirlashda xatolik!");
    }
  };

  const cancelBooking = async (b) => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) return message.error("Avval tizimga kiring!");

      // If already accepted: send cancel request to driver (driver should confirm to refund fee)
      if (b.status === "accepted") {
        const v3 = await supabase.rpc("request_cancel_after_accept", {
          p_request_id: b.id,
          p_passenger_id: user.id,
        });
        if (v3?.error) {
          // fallback: mark status if column exists
          try {
            await supabase.from("trip_booking_requests").update({ status: "cancel_requested" }).eq("id", b.id).eq("passenger_id", user.id);
          } catch (e) {}
        }
        message.success("Bekor qilish so‘rovi haydovchiga yuborildi. Haydovchi tasdiqlasa to‘lov qaytariladi.");
      } else {
        // requested -> immediate cancel
        const v2 = await supabase.rpc("cancel_booking_request", {
          p_request_id: b.id,
          p_passenger_id: user.id,
        });

        if (v2?.error) {
          const v1 = await supabase.rpc("cancel_booking_request", {
            p_booking_id: b.id,
            p_passenger_id: user.id,
          });
          if (v1?.error) throw v1.error;
        }
        message.success("So‘rov bekor qilindi. Joylar qaytarildi.");
      }
      await doSearch(true);
      await loadMyBookings();
    } catch (e) {
      console.error(e);
      message.error(e?.message || "Bekor qilishda xatolik!");
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
            <Title level={5} style={{ marginTop: 0 }}>Qidiruv filtrlari</Title>

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
                    { value: "home_pickup", label: "Uydan olib ketishga" },
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
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <Switch checked={deliveryOnly} onChange={(v) => setDeliveryOnly(!!v)} />
              <Text style={{ fontWeight: 600 }}>Eltish xizmati</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>(faqat “eltish xizmati” e’lonlarini ko‘rsatish)</Text>
            </div>

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
                                {order.pickup_mode === "home_pickup" ? "Uydan olib ketishga" : "Belgilangan joyga kelish"}
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
                { value: "home_pickup", label: "Uydan olib ketishga" },
              ]}
            />

            {deliveryType === "meet_point" ? (
              <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 10 }}>
                * Haydovchi belgilagan ketish joyiga borasiz. (Agar haydovchi meet-point qo‘ygan bo‘lsa, xaritada ko‘rish mumkin.)
              </Text>
            ) : (
              <>
                <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 10 }}>
                  * Uydan olib ketishga lokatsiyangiz kerak. Haydovchi faqat qabul qilgandan keyin ko‘radi.
                </Text>

                <Space style={{ marginTop: 10 }} wrap>
                  <Button
                    icon={<AimOutlined />}
                    onClick={async () => {
                      try {
                        const p = await getMyGeo();
                        setPickupLat(p.lat);
                        setPickupLng(p.lng);
                        const addr = await reverseGeocodeOSM(p.lat, p.lng);
                        if (addr) setPickupAddress(addr);
                        message.success("Lokatsiya olindi");
                      } catch (e) {
                        message.error("Lokatsiyani olishda xatolik");
                      }
                    }}
                  >
                    Geolokatsiyadan olish
                  </Button>

                  <Button onClick={openPickupPicker}>Xaritadan tanlash</Button>

                  {pickupLat != null && pickupLng != null ? (
                    <>
                      <Button onClick={() => openMapEmbed({ title: "Xarita", lat: pickupLat, lng: pickupLng, mode: "pin" })}>Ko‘rish</Button>
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
        title="Uy manzilini xaritadan tanlash"
        open={pickerModal.open}
        onCancel={() => setPickerModal({ open: false })}
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
              <Button onClick={() => setPickerModal({ open: false })}>Bekor</Button>
              <Button type="primary" onClick={applyPickerToPickup}>
                Tanlash
              </Button>
            </div>
          </div>
        </div>
      </Modal>

    </div>
  );
}
