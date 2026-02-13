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
} from "@ant-design/icons";
import dayjs from "dayjs";
import { translations } from "@i18n/translations";
import { supabase } from "../../../../lib/supabase";

const { Title, Text } = Typography;

/**
 * ===========================
 * DriverInterProvincial.jsx (WORKING)
 * ===========================
 * - Driver creates InterProv ad (service_type=inter_prov)
 * - Can edit/cancel own ad; persists after re-login (loads from DB)
 * - Booking requests come as "requests" tab (status=requested) -> driver Accept/Reject
 * - After accept: passenger phone becomes visible + comment "Yo‘lovchi bilan bog‘laning"
 * - Notifications modal (simple notifications table)
 *
 * NOTE:
 * - This file expects these DB objects to exist:
 *   tables: orders, trip_booking_requests, trip_bookings, notifications, driver_wallet(optional)
 *   RPCs:
 *     accept_inter_prov_booking(p_booking_id, p_driver_id)
 *     reject_inter_prov_booking(p_booking_id, p_driver_id)
 * - If you have *_v2 RPCs, you can rename easily below (see callRpc helper).
 */

// --- VILOYATLAR VA TUMANLAR RO'YXATI (UZ) ---
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

const getDistricts = (regionName) => {
  const region = REGIONS_DATA.find((r) => r.name === regionName);
  return region ? region.districts : [];
};

const isTashkentCity = (regionName) => regionName === "Toshkent shahri";
const districtLabel = (district) => (district && String(district).trim() ? district : "Hammasi");
const formatMoney = (n) => Number(n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

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

const openGoogleMaps = (lat, lng) => {
  if (lat == null || lng == null) return;
  window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank", "noopener,noreferrer");
};
const openGoogleDirectionsTo = (lat, lng) => {
  if (lat == null || lng == null) return;
  window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, "_blank", "noopener,noreferrer");
};

const getMyGeo = async () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Geolokatsiya qo‘llab-quvvatlanmaydi"));
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 20000 }
    );
  });

// Try RPC name1 then name2 (for compatibility)
const callRpc = async (name1, name2, args) => {
  const r1 = await supabase.rpc(name1, args);
  if (!r1.error) return r1;
  if (!name2) return r1;
  const r2 = await supabase.rpc(name2, args);
  return r2;
};

export default function DriverInterProvincial({ onBack }) {
  const savedLang = localStorage.getItem("appLang") || "uz_lotin";
  const t = translations?.[savedLang] || translations?.["uz_lotin"] || {};

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

  // NEW: pickup mode + locations
  const [pickupMode, setPickupMode] = useState("meet_point"); // meet_point | home_pickup
  const [meetLat, setMeetLat] = useState(null);
  const [meetLng, setMeetLng] = useState(null);
  const [meetAddress, setMeetAddress] = useState("");
  const [destLat, setDestLat] = useState(null);
  const [destLng, setDestLng] = useState(null);
  const [destAddress, setDestAddress] = useState("");

  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem("driverInterProvDraft_v4");
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
    };
  });

  // persist draft
  useEffect(() => {
    localStorage.setItem(
      "driverInterProvDraft_v4",
      JSON.stringify({ ...formData })
    );
  }, [formData]);

  const fromDistricts = useMemo(() => {
    const list = getDistricts(formData.fromRegion);
    if (isTashkentCity(formData.fromRegion)) return ["", ...list.filter((d) => d !== "")];
    return list;
  }, [formData.fromRegion]);

  const toDistricts = useMemo(() => {
    const list = getDistricts(formData.toRegion);
    if (isTashkentCity(formData.toRegion)) return ["", ...list.filter((d) => d !== "")];
    return list;
  }, [formData.toRegion]);

  const validate = () => {
    if (!formData.fromRegion || !String(formData.fromRegion).trim()) {
      message.error("Qayerdan viloyatini tanlang!");
      return false;
    }
    if (!isTashkentCity(formData.fromRegion) && (!formData.fromDistrict || !String(formData.fromDistrict).trim())) {
      message.error("Qayerdan tumanini tanlang!");
      return false;
    }
    if (!formData.toRegion || !String(formData.toRegion).trim()) {
      message.error("Qayerga viloyatini tanlang!");
      return false;
    }
    if (!isTashkentCity(formData.toRegion) && (!formData.toDistrict || !String(formData.toDistrict).trim())) {
      message.error("Qayerga tumanini tanlang!");
      return false;
    }
    if (formData.fromRegion === formData.toRegion && (formData.fromDistrict || "") === (formData.toDistrict || "")) {
      message.error("Qayerdan va qayerga bir xil bo‘lmasin!");
      return false;
    }
    if (!formData.date || !formData.time) {
      message.error("Sana va vaqtni tanlang!");
      return false;
    }
    if (!formData.seatsTotal || formData.seatsTotal < 1) {
      message.error("O‘rindiqlar soni kamida 1 bo‘lsin!");
      return false;
    }
    if (!formData.price || formData.price < 1000) {
      message.error("Narxni to‘g‘ri kiriting!");
      return false;
    }
    if (pickupMode === "meet_point") {
      // driver should set meet point coordinates (can be empty if you want; here we recommend)
      if (meetLat == null || meetLng == null) {
        message.warning("Ketish joyi lokatsiyasini belgilang (geolokatsiya).");
      }
    }
    return true;
  };

  const loadNotifications = async (userId) => {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return data || [];
  };

  const markNotifRead = async (ids) => {
    if (!ids || ids.length === 0) return;
    try {
      await supabase.from("notifications").update({ is_read: true }).in("id", ids);
    } catch (e) {}
  };

  const loadDriverBalance = async (userId) => {
    // If you have driver_wallet table, use it; otherwise return null
    try {
      const { data, error } = await supabase.from("driver_wallet").select("balance").eq("user_id", userId).single();
      if (error) return null;
      return data?.balance ?? null;
    } catch (e) {
      return null;
    }
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

    // Load latest active ad (pending/booked)
    const { data: ad, error: adErr } = await supabase
      .from("orders")
      .select("*")
      .eq("service_type", "inter_prov")
      .eq("driver_id", user.id)
      .in("status", ["pending", "booked"])
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (adErr && adErr.code !== "PGRST116") {
      // PGRST116 = No rows
      console.error(adErr);
    }

    setActiveAd(adErr ? null : ad);

    // fill pickup fields from ad
    if (!adErr && ad) {
      setPickupMode(ad.pickup_mode || "meet_point");
      setMeetLat(ad.meet_lat ?? null);
      setMeetLng(ad.meet_lng ?? null);
      setMeetAddress(ad.meet_address || "");
      setDestLat(ad.dest_lat ?? null);
      setDestLng(ad.dest_lng ?? null);
      setDestAddress(ad.dest_address || "");
    }

    // Load booking requests for my ad
    if (!adErr && ad?.id) {
      const { data: reqs } = await supabase
        .from("trip_booking_requests")
        .select("*")
        .eq("order_id", ad.id)
        .order("created_at", { ascending: false });

      const list = reqs || [];
      setRequests(list.filter((x) => x.status === "requested"));
      setAccepted(list.filter((x) => x.status === "accepted"));
    } else {
      setRequests([]);
      setAccepted([]);
    }

    // Balance + notifications
    const bal = await loadDriverBalance(user.id);
    setDriverBalance(bal);

    try {
      const notifs = await loadNotifications(user.id);
      setNotifications(notifs);
    } catch (e) {
      setNotifications([]);
    }
  };

  const fillFormFromActive = (o) => {
    if (!o) return;
    const sched = o.scheduled_at ? dayjs(o.scheduled_at) : null;
    setFormData((prev) => ({
      ...prev,
      fromRegion: o.from_region || prev.fromRegion,
      fromDistrict: o.from_district ?? "",
      toRegion: o.to_region || prev.toRegion,
      toDistrict: o.to_district ?? "",
      date: sched ? sched.format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"),
      time: sched ? sched.format("HH:mm") : "09:00",
      seatsTotal: Number(o.seats_total || 4),
      price: Number(o.price || 0),
    }));
  };

  useEffect(() => {
    let isMounted = true;
    let channel = null;

    const loadAll = async () => {
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
              if (row?.driver_id === user.id) loadDriverData();
            })
            .on("postgres_changes", { event: "*", schema: "public", table: "trip_booking_requests" }, (payload) => {
              const row = payload?.new || payload?.old;
              if (row?.driver_id === user.id || activeAd?.id === row?.order_id) loadDriverData();
            })
            .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, (payload) => {
              const row = payload?.new || payload?.old;
              if (row?.user_id === user.id) loadDriverData();
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

    loadAll();

    return () => {
      isMounted = false;
      if (channel) supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeAd) fillFormFromActive(activeAd);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeAd?.id]);

  const createAd = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr) throw authErr;
      const user = authData?.user;
      if (!user) return;

      const scheduledAt = dayjs(`${formData.date} ${formData.time}`, "YYYY-MM-DD HH:mm").toISOString();

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

        // NEW fields (if columns exist)
        pickup_mode: pickupMode, // meet_point | home_pickup
        meet_lat: meetLat,
        meet_lng: meetLng,
        meet_address: meetAddress,
        dest_lat: destLat,
        dest_lng: destLng,
        dest_address: destAddress,
      };

      const { data, error } = await supabase.from("orders").insert(payload).select("*").single();
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
      const scheduledAt = dayjs(`${formData.date} ${formData.time}`, "YYYY-MM-DD HH:mm").toISOString();

      const hasRequestsOrAccepted = (requests.length + accepted.length) > 0;
      const seatsPatch = hasRequestsOrAccepted ? {} : { seats_total: formData.seatsTotal, seats_available: formData.seatsTotal };

      const patch = {
        from_region: formData.fromRegion,
        from_district: (formData.fromDistrict || "").trim(),
        to_region: formData.toRegion,
        to_district: (formData.toDistrict || "").trim(),
        scheduled_at: scheduledAt,
        price: formData.price,
        pickup_location: `${formData.fromRegion}, ${districtLabel(formData.fromDistrict)}`,
        dropoff_location: `${formData.toRegion}, ${districtLabel(formData.toDistrict)}`,

        pickup_mode: pickupMode,
        meet_lat: meetLat,
        meet_lng: meetLng,
        meet_address: meetAddress,
        dest_lat: destLat,
        dest_lng: destLng,
        dest_address: destAddress,

        ...seatsPatch,
      };

      const { data, error } = await supabase.from("orders").update(patch).eq("id", activeAd.id).select("*").single();
      if (error) throw error;

      setActiveAd(data);
      setEditMode(false);

      // notify (optional)
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

  const openNotifications = async () => {
    setNotifOpen(true);
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    await markNotifRead(unreadIds);

    const { data: authData } = await supabase.auth.getUser();
    if (authData?.user?.id) {
      try {
        const notifs2 = await loadNotifications(authData.user.id);
        setNotifications(notifs2);
      } catch (e) {}
    }
  };

  const acceptRequest = async (bookingId) => {
    if (!activeAd) return;
    setSubmitting(true);
    try {
      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr) throw authErr;
      const user = authData?.user;
      if (!user) return;

      const { error } = await callRpc(
        "accept_inter_prov_booking",
        "accept_booking_request_v2",
        { p_booking_id: bookingId, p_driver_id: user.id }
      );
      if (error) throw error;

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
      if (!user) return;

      const { error } = await callRpc(
        "reject_inter_prov_booking",
        "reject_booking_request_v2",
        { p_booking_id: bookingId, p_driver_id: user.id }
      );
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
            <Button icon={<BellOutlined />} onClick={openNotifications}>
              Bildirishnomalar
            </Button>
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
                    <Tag color={pickupMode === "home_pickup" ? "purple" : "blue"} style={{ padding: "4px 10px", borderRadius: 999 }}>
                      {pickupMode === "home_pickup" ? "Uydan olib ketish" : "Belgilangan joyga borish"}
                    </Tag>
                    {Number(activeAd.seats_available || 0) <= 0 ? (
                      <Tag color="red" style={{ padding: "4px 10px", borderRadius: 999 }}>Joylar tugadi</Tag>
                    ) : null}
                  </Space>

                  {/* Locations summary */}
                  <div style={{ marginTop: 8 }}>
                    {meetAddress ? <Text type="secondary">Ketish joyi: <b>{meetAddress}</b></Text> : null}
                    {meetLat != null && meetLng != null ? (
                      <div style={{ marginTop: 6 }}>
                        <Space wrap>
                          <Button size="small" onClick={() => openGoogleMaps(meetLat, meetLng)}>Xaritada</Button>
                          <Button size="small" onClick={() => openGoogleDirectionsTo(meetLat, meetLng)}>Yo‘l</Button>
                        </Space>
                      </div>
                    ) : null}

                    {destAddress ? <div style={{ marginTop: 10 }}><Text type="secondary">Manzil: <b>{destAddress}</b></Text></div> : null}
                    {destLat != null && destLng != null ? (
                      <div style={{ marginTop: 6 }}>
                        <Space wrap>
                          <Button size="small" onClick={() => openGoogleMaps(destLat, destLng)}>Xaritada</Button>
                          <Button size="small" onClick={() => openGoogleDirectionsTo(destLat, destLng)}>Yo‘l</Button>
                        </Space>
                      </div>
                    ) : null}
                  </div>
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
                </Space>
              </Col>
            </Row>

            {editMode ? (
              <div style={{ marginTop: 16 }}>
                <Divider orientation="left">Tahrirlash</Divider>

                <Row gutter={12}>
                  <Col xs={24} md={12}>
                    <Text type="secondary">Qayerdan viloyat</Text>
                    <Select value={formData.fromRegion} onChange={(v) => setFormData((p) => ({ ...p, fromRegion: v }))} style={{ width: "100%", marginTop: 6 }} size="large">
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
                    <Select value={formData.toRegion} onChange={(v) => setFormData((p) => ({ ...p, toRegion: v }))} style={{ width: "100%", marginTop: 6 }} size="large">
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
                    <DatePicker value={dayjs(formData.date)} onChange={(d) => setFormData((p) => ({ ...p, date: d ? d.format("YYYY-MM-DD") : "" }))} style={{ width: "100%", marginTop: 6 }} size="large" />
                  </Col>
                  <Col xs={24} md={12}>
                    <Text type="secondary">Vaqt</Text>
                    <TimePicker value={dayjs(formData.time, "HH:mm")} onChange={(tVal) => setFormData((p) => ({ ...p, time: tVal ? tVal.format("HH:mm") : "" }))} format="HH:mm" style={{ width: "100%", marginTop: 6 }} size="large" />
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

                <Divider orientation="left">Olib ketish turi</Divider>
                <Select
                  value={pickupMode}
                  onChange={(v) => setPickupMode(v)}
                  style={{ width: "100%", marginTop: 6 }}
                  size="large"
                  options={[
                    { value: "meet_point", label: "Belgilangan joyga borish" },
                    { value: "home_pickup", label: "Uydan olib ketish" },
                  ]}
                />

                <Divider orientation="left">Ketish joyi (haydovchi ketadigan nuqta)</Divider>
                <Space wrap>
                  <Button
                    icon={<EnvironmentFilled />}
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
                    Geolokatsiyadan olish
                  </Button>
                  {meetLat != null && meetLng != null ? (
                    <>
                      <Button onClick={() => openGoogleMaps(meetLat, meetLng)}>Xaritada ko‘rish</Button>
                      <Button onClick={() => openGoogleDirectionsTo(meetLat, meetLng)}>Yo‘l ko‘rsatish</Button>
                    </>
                  ) : null}
                </Space>
                <Input
                  value={meetAddress}
                  onChange={(e) => setMeetAddress(e.target.value)}
                  placeholder="Ketish joyi manzili (masalan: Nukus, Avtovokzal)"
                  style={{ marginTop: 8 }}
                />

                <Divider orientation="left">Ketish manzili (destination)</Divider>
                <Space wrap>
                  <Button
                    icon={<EnvironmentFilled />}
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
                    Geolokatsiyadan olish
                  </Button>
                  {destLat != null && destLng != null ? (
                    <>
                      <Button onClick={() => openGoogleMaps(destLat, destLng)}>Xaritada ko‘rish</Button>
                      <Button onClick={() => openGoogleDirectionsTo(destLat, destLng)}>Yo‘l ko‘rsatish</Button>
                    </>
                  ) : null}
                </Space>
                <Input
                  value={destAddress}
                  onChange={(e) => setDestAddress(e.target.value)}
                  placeholder="Manzil nomi (masalan: Toshkent Markaziy Bozor)"
                  style={{ marginTop: 8 }}
                />

                <Divider />

                <Button type="primary" size="large" block icon={<SaveOutlined />} onClick={saveEdits} loading={submitting} style={{ borderRadius: 14, height: 48 }}>
                  Saqlash
                </Button>
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
                                <Button
                                  key="accept"
                                  type="primary"
                                  icon={<CheckOutlined />}
                                  loading={submitting}
                                  onClick={() => acceptRequest(b.id)}
                                >
                                  Qabul qilish
                                </Button>,
                                <Button
                                  key="reject"
                                  danger
                                  icon={<CloseOutlined />}
                                  loading={submitting}
                                  onClick={() => rejectRequest(b.id)}
                                >
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
                                  <>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                      So‘rov vaqti: {dayjs(b.created_at).format("YYYY-MM-DD HH:mm")}
                                    </Text>
                                    {b.pickup_address ? (
                                      <div style={{ marginTop: 6 }}>
                                        <Tag color="purple">Uy manzili</Tag> {b.pickup_address}
                                        {b.pickup_lat != null && b.pickup_lng != null ? (
                                          <Space style={{ marginTop: 6 }} wrap>
                                            <Button size="small" onClick={() => openGoogleMaps(b.pickup_lat, b.pickup_lng)}>Xarita</Button>
                                            <Button size="small" onClick={() => openGoogleDirectionsTo(b.pickup_lat, b.pickup_lng)}>Yo‘l</Button>
                                          </Space>
                                        ) : null}
                                      </div>
                                    ) : null}
                                  </>
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
                            <List.Item>
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
                                    <div style={{ marginTop: 6 }}>
                                      <Text type="secondary">
                                        Kommentariya: <b>Yo‘lovchi bilan bog‘laning</b>
                                      </Text>
                                    </div>
                                    {b.pickup_address ? (
                                      <div style={{ marginTop: 8 }}>
                                        <Tag color="purple">Uy manzili</Tag> <b>{b.pickup_address}</b>
                                        {b.pickup_lat != null && b.pickup_lng != null ? (
                                          <Space style={{ marginTop: 6 }} wrap>
                                            <Button size="small" onClick={() => openGoogleMaps(b.pickup_lat, b.pickup_lng)}>Xarita</Button>
                                            <Button size="small" onClick={() => openGoogleDirectionsTo(b.pickup_lat, b.pickup_lng)}>Yo‘l</Button>
                                          </Space>
                                        ) : null}
                                      </div>
                                    ) : null}
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
                <Select value={formData.fromRegion} onChange={(v) => setFormData((p) => ({ ...p, fromRegion: v }))} style={{ width: "100%", marginTop: 6 }} size="large">
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
              </Col>
            </Row>

            <Divider orientation="left">Qayerga</Divider>
            <Row gutter={12}>
              <Col xs={24} md={12}>
                <Text type="secondary">Viloyat</Text>
                <Select value={formData.toRegion} onChange={(v) => setFormData((p) => ({ ...p, toRegion: v }))} style={{ width: "100%", marginTop: 6 }} size="large">
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
              </Col>
            </Row>

            <Divider />

            <Row gutter={12}>
              <Col xs={24} md={12}>
                <Text type="secondary">Sana</Text>
                <DatePicker value={dayjs(formData.date)} onChange={(d) => setFormData((p) => ({ ...p, date: d ? d.format("YYYY-MM-DD") : "" }))} style={{ width: "100%", marginTop: 6 }} size="large" />
              </Col>
              <Col xs={24} md={12}>
                <Text type="secondary">Vaqt</Text>
                <TimePicker value={dayjs(formData.time, "HH:mm")} onChange={(tVal) => setFormData((p) => ({ ...p, time: tVal ? tVal.format("HH:mm") : "" }))} format="HH:mm" style={{ width: "100%", marginTop: 6 }} size="large" />
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

            <Divider orientation="left">Olib ketish turi</Divider>
            <Select
              value={pickupMode}
              onChange={(v) => setPickupMode(v)}
              style={{ width: "100%", marginTop: 6 }}
              size="large"
              options={[
                { value: "meet_point", label: "Belgilangan joyga borish" },
                { value: "home_pickup", label: "Uydan olib ketish" },
              ]}
            />

            <Divider orientation="left">Ketish joyi (haydovchi ketadigan nuqta)</Divider>
            <Space wrap>
              <Button
                icon={<EnvironmentFilled />}
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
                Geolokatsiyadan olish
              </Button>
              {meetLat != null && meetLng != null ? (
                <>
                  <Button onClick={() => openGoogleMaps(meetLat, meetLng)}>Xaritada ko‘rish</Button>
                  <Button onClick={() => openGoogleDirectionsTo(meetLat, meetLng)}>Yo‘l ko‘rsatish</Button>
                </>
              ) : null}
            </Space>
            <Input
              value={meetAddress}
              onChange={(e) => setMeetAddress(e.target.value)}
              placeholder="Ketish joyi manzili (masalan: Nukus, Avtovokzal)"
              style={{ marginTop: 8 }}
            />

            <Divider orientation="left">Ketish manzili (destination)</Divider>
            <Space wrap>
              <Button
                icon={<EnvironmentFilled />}
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
                Geolokatsiyadan olish
              </Button>
              {destLat != null && destLng != null ? (
                <>
                  <Button onClick={() => openGoogleMaps(destLat, destLng)}>Xaritada ko‘rish</Button>
                  <Button onClick={() => openGoogleDirectionsTo(destLat, destLng)}>Yo‘l ko‘rsatish</Button>
                </>
              ) : null}
            </Space>
            <Input
              value={destAddress}
              onChange={(e) => setDestAddress(e.target.value)}
              placeholder="Manzil nomi (masalan: Toshkent Markaziy Bozor)"
              style={{ marginTop: 8 }}
            />

            <Divider />

            <Button type="primary" size="large" block icon={<SendOutlined />} onClick={createAd} loading={submitting} style={{ borderRadius: 14, height: 48 }}>
              E’lonni yaratish
            </Button>
          </Card>
        )}
      </div>
    </ConfigProvider>
  );
}