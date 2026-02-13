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
} from "@ant-design/icons";
import dayjs from "dayjs";
import { supabase } from "../../../lib/supabase";

const { Title, Text } = Typography;

/**
 * ===========================
 * ClientInterProvincial.jsx (WORKING)
 * ===========================
 * - Passenger searches inter_prov orders
 * - Can filter by district (wildcard supported: driver empty district means "hammasi")
 * - Booking request sends passenger name/phone (auto from localStorage, editable)
 * - Passenger sees own requests after re-login (loads from trip_booking_requests)
 * - Can edit/cancel only when status=requested
 * - NEW: pickup mode filter + home pickup geolocation sending
 *
 * DB expected:
 *   orders table: has pickup_mode (meet_point|home_pickup), meet_*, dest_* (optional)
 *   trip_booking_requests table: has pickup_lat, pickup_lng, pickup_address (optional)
 * RPCs:
 *   request_inter_prov_booking(p_order_id, p_passenger_id, p_passenger_name, p_passenger_phone, p_seats, p_pickup_lat?, p_pickup_lng?, p_pickup_address?)
 *   update_inter_prov_booking_seats(p_booking_id, p_passenger_id, p_new_seats)
 *   cancel_inter_prov_booking(p_booking_id, p_passenger_id)
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

const statusLabel = (s) => {
  if (s === "requested") return { text: "So‘rov yuborildi", color: "gold" };
  if (s === "accepted") return { text: "Qabul qilindi", color: "green" };
  if (s === "rejected") return { text: "Rad etildi", color: "red" };
  if (s === "cancelled") return { text: "Bekor qilingan", color: "default" };
  return { text: s, color: "default" };
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

// Try RPC name1 then name2 (compatibility)
const callRpc = async (name1, name2, args) => {
  const r1 = await supabase.rpc(name1, args);
  if (!r1.error) return r1;
  if (!name2) return r1;
  const r2 = await supabase.rpc(name2, args);
  return r2;
};

export default function ClientInterProvincial({ onBack }) {
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  const [results, setResults] = useState([]);
  const [errorText, setErrorText] = useState("");

  // my booking requests list (my)
  const [myBookings, setMyBookings] = useState([]);
  const [myLoading, setMyLoading] = useState(false);

  // booking modal
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [bookingSeats, setBookingSeats] = useState(1);

  // passenger info (auto fill + editable)
  const [passengerName, setPassengerName] = useState("");
  const [passengerPhone, setPassengerPhone] = useState("");

  // NEW: passenger home pickup geo (only when order.pickup_mode === home_pickup)
  const [pickupLat, setPickupLat] = useState(null);
  const [pickupLng, setPickupLng] = useState(null);
  const [pickupAddress, setPickupAddress] = useState("");

  // edit booking modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editBooking, setEditBooking] = useState(null);
  const [editSeats, setEditSeats] = useState(1);

  const [form, setForm] = useState(() => {
    const saved = localStorage.getItem("clientInterProvSearch_v4");
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
          pickupMode: p.pickupMode || "all", // all | meet_point | home_pickup
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
      pickupMode: "all",
    };
  });

  useEffect(() => {
    localStorage.setItem("clientInterProvSearch_v4", JSON.stringify({ ...form }));
  }, [form]);

  const fromDistricts = useMemo(() => {
    const list = getDistricts(form.fromRegion);
    if (isTashkentCity(form.fromRegion)) return ["", ...list.filter((d) => d !== "")];
    return list;
  }, [form.fromRegion]);

  const toDistricts = useMemo(() => {
    const list = getDistricts(form.toRegion);
    if (isTashkentCity(form.toRegion)) return ["", ...list.filter((d) => d !== "")];
    return list;
  }, [form.toRegion]);

  const loadMyBookings = async () => {
    setMyLoading(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) {
        setMyBookings([]);
        return;
      }

      const { data, error } = await supabase
        .from("trip_booking_requests")
        .select("*, orders:order_id(*)")
        .eq("passenger_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMyBookings(data || []);
    } catch (e) {
      console.error(e);
      setMyBookings([]);
    } finally {
      setMyLoading(false);
    }
  };

  const loadMyData = async () => {
    // auto-fill from localStorage
    const savedName = localStorage.getItem("passenger_name") || "";
    const savedPhone = localStorage.getItem("passenger_phone") || "";
    if (savedName) setPassengerName(savedName);
    if (savedPhone) setPassengerPhone(savedPhone);
    await loadMyBookings();
  };

  useEffect(() => {
    let isMounted = true;
    let channel = null;

    const loadAll = async () => {
      try {
        setLoading(true);
        await doSearch(true);
        await loadMyData();

        const { data: authData } = await supabase.auth.getUser();
        const user = authData?.user;

        if (user && isMounted) {
          channel = supabase
            .channel("client-interprov-live")
            .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
              doSearch(true);
            })
            .on("postgres_changes", { event: "*", schema: "public", table: "trip_booking_requests" }, (payload) => {
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
        .eq("to_region", form.toRegion)
        .order("scheduled_at", { ascending: true });

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

      const { data, error } = await q;
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

  const openBooking = async (order) => {
    setSelectedOrder(order);
    setBookingSeats(1);

    // auto-fill again
    const savedName = localStorage.getItem("passenger_name") || "";
    const savedPhone = localStorage.getItem("passenger_phone") || "";
    setPassengerName(savedName);
    setPassengerPhone(savedPhone);

    // reset pickup geo
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
      if (!String(passengerPhone || "").trim()) return message.error("Telefon raqamingizni kiriting!");

      if (selectedOrder.pickup_mode === "home_pickup") {
        if (pickupLat == null || pickupLng == null) {
          return message.error("Uydan olib ketish uchun lokatsiyani yuboring!");
        }
      }

      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr) throw authErr;
      const user = authData?.user;
      if (!user) return message.error("So‘rov yuborish uchun avval tizimga kiring!");

      // save passenger info (auto next time)
      localStorage.setItem("passenger_name", passengerName);
      localStorage.setItem("passenger_phone", passengerPhone);

      const args = {
        p_order_id: selectedOrder.id,
        p_passenger_id: user.id,
        p_passenger_name: passengerName || "",
        p_passenger_phone: passengerPhone,
        p_seats: seatsReq,
        // optional (if your RPC supports)
        p_pickup_lat: pickupLat,
        p_pickup_lng: pickupLng,
        p_pickup_address: pickupAddress,
      };

      const { error } = await callRpc("request_inter_prov_booking", "request_inter_prov_booking_v2", args);
      if (error) throw error;

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
    setEditModalOpen(true);
  };

  const saveEditBookingSeats = async () => {
    try {
      if (!editBooking) return;
      const newSeats = Number(editSeats || 1);

      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) return message.error("Avval tizimga kiring!");

      const { error } = await callRpc("update_inter_prov_booking_seats", "edit_booking_request_v2", {
        p_booking_id: editBooking.id,
        p_passenger_id: user.id,
        p_new_seats: newSeats,
        p_seats: newSeats, // for v2 alt naming
      });

      if (error) throw error;

      message.success("So‘rov joylari yangilandi!");
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

      const { error } = await callRpc("cancel_inter_prov_booking", "cancel_booking_request", {
        p_booking_id: b.id,
        p_passenger_id: user.id,
        p_request_id: b.id, // alt
      });

      if (error) throw error;

      message.success("So‘rov bekor qilindi. Joylar qaytarildi.");
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
                <Select value={form.fromRegion} onChange={(v) => setForm((p) => ({ ...p, fromRegion: v }))} style={{ width: "100%", marginTop: 6 }} size="large">
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
                <Select value={form.toRegion} onChange={(v) => setForm((p) => ({ ...p, toRegion: v }))} style={{ width: "100%", marginTop: 6 }} size="large">
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
              <Col xs={24} md={6}>
                <Text type="secondary">Sana (ixtiyoriy)</Text>
                <DatePicker value={form.date ? dayjs(form.date) : null} onChange={(d) => setForm((p) => ({ ...p, date: d ? d.format("YYYY-MM-DD") : "" }))} style={{ width: "100%", marginTop: 6 }} size="large" allowClear />
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
                    { value: "meet_point", label: "Belgilangan joyga borish" },
                    { value: "home_pickup", label: "Uydan olib ketish" },
                  ]}
                />
              </Col>
              <Col xs={24} md={6}>
                <Button type="primary" size="large" block icon={<SearchOutlined />} loading={searching} onClick={() => doSearch(false)} style={{ borderRadius: 14, height: 48, marginTop: 24 }}>
                  Qidirish
                </Button>
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
                              <Tag color={order.pickup_mode === "home_pickup" ? "purple" : "blue"}>
                                {order.pickup_mode === "home_pickup" ? "Uydan olib ketish" : "Belgilangan joyga borish"}
                              </Tag>
                            </Space>

                            {order.meet_address ? (
                              <div style={{ marginTop: 6 }}>
                                <Text type="secondary">Ketish joyi: <b>{order.meet_address}</b></Text>
                                {order.meet_lat != null && order.meet_lng != null ? (
                                  <Space style={{ marginTop: 6 }} wrap>
                                    <Button size="small" onClick={() => openGoogleMaps(order.meet_lat, order.meet_lng)}>Xaritada</Button>
                                    <Button size="small" onClick={() => openGoogleDirectionsTo(order.meet_lat, order.meet_lng)}>Yo‘l</Button>
                                  </Space>
                                ) : null}
                              </div>
                            ) : null}

                            {order.dest_address ? (
                              <div style={{ marginTop: 6 }}>
                                <Text type="secondary">Manzil: <b>{order.dest_address}</b></Text>
                              </div>
                            ) : null}
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
                              <div style={{ marginTop: 8 }}>
                                <Text type="secondary">Kommentariya: </Text>
                                <b>Haydovchi qabul qildi, tez orada bog‘laning.</b>
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

            <Text type="secondary">Nechta joy so‘raysiz?</Text>
            <InputNumber min={1} max={Number(selectedOrder.seats_available || 1)} value={bookingSeats} onChange={(v) => setBookingSeats(Number(v || 1))} style={{ width: "100%", marginTop: 6 }} />

            {selectedOrder.pickup_mode === "home_pickup" ? (
              <>
                <Divider />
                <Tag color="purple">Uydan olib ketish</Tag>
                <Text type="secondary" style={{ display: "block", marginTop: 8 }}>
                  Lokatsiyani yuboring (haydovchi qabul qilgach ko‘radi).
                </Text>
                <Space wrap style={{ marginTop: 8 }}>
                  <Button
                    icon={<EnvironmentFilled />}
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
                    Geolokatsiya yuborish
                  </Button>
                  {pickupLat != null && pickupLng != null ? (
                    <Button onClick={() => openGoogleMaps(pickupLat, pickupLng)}>Xaritada</Button>
                  ) : null}
                </Space>
                <Input
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  placeholder="Manzil (ixtiyoriy): masalan, Uyim - Chilonzor 5"
                  style={{ marginTop: 8 }}
                />
              </>
            ) : null}

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
            <Text type="secondary">Nechta joy?</Text>
            <InputNumber min={1} max={20} value={editSeats} onChange={(v) => setEditSeats(Number(v || 1))} style={{ width: "100%", marginTop: 6 }} />
            <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 10 }}>
              * Faqat “requested” holatda tahrirlash mumkin. Joy ko‘paytirsangiz tizimda joy yetarliligi tekshiriladi.
            </Text>
          </div>
        )}
      </Modal>
    </div>
  );
}