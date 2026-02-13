import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Card,
  Button,
  Typography,
  Row,
  Col,
  DatePicker,
  TimePicker,
  InputNumber,
  Space,
  message,
  Divider,
  Select,
  Tag,
  Skeleton,
  List,
  Modal,
  Input,
  Tabs,
  Badge,
  Popconfirm,
  Switch,
} from "antd";
import {
  EnvironmentFilled,
  CalendarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CheckOutlined,
  CloseOutlined,
  PlusOutlined,
  AimOutlined,
  EditOutlined,
  StopOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { supabase } from "../../../../lib/supabase";

const { Title, Text } = Typography;

/**
 * ✅ DB TABLES
 */
const RIDES_TABLE = "inter_prov_rides";
const BOOKINGS_TABLE = "inter_prov_bookings";

/**
 * ✅ RPCs
 */
const ACCEPT_RPC = "accept_inter_prov_booking";
const REJECT_RPC = "reject_inter_prov_booking";

/**
 * ✅ Accept fee for now
 */
const ACCEPT_FEE_SUM = 0;

/**
 * --- REGIONS (minimal demo, replace with your full list) ---
 */
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

const regionOptions = REGIONS_DATA.map((r) => ({ label: r.name, value: r.name }));
const districtsByRegion = (regionName) =>
  REGIONS_DATA.find((r) => r.name === regionName)?.districts?.map((d) => ({ label: d, value: d })) || [];

const fmtMoney = (n) => {
  const v = Number(n || 0);
  return v.toLocaleString("uz-UZ");
};

const safeMapUrl = ({ lat, lng, mode, sLat, sLng }) => {
  if (!lat || !lng) return "";
  if (mode === "route" && sLat && sLng) {
    return `https://www.google.com/maps?saddr=${sLat},${sLng}&daddr=${lat},${lng}&output=embed`;
  }
  return `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`;
};

const AcceptButtonWithNote = ({ onAccept, disabled }) => {
  return (
    <div style={{ minWidth: 180 }}>
      <Button block type="primary" icon={<CheckOutlined />} disabled={disabled} onClick={onAccept}>
        Qabul qilish
      </Button>
      <div style={{ marginTop: 6, lineHeight: 1.2 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Qabul qilish tugmasini bossangiz hisobingizdan pul yechiladi.
        </Text>
        <br />
        <Text type="secondary" style={{ fontSize: 12 }}>
          (Hozircha: {fmtMoney(ACCEPT_FEE_SUM)} so‘m)
        </Text>
      </div>
    </div>
  );
};

export default function DriverInterProvincial() {
  const formRef = useRef(null);

  const [loading, setLoading] = useState(true);

  // Auth
  const [session, setSession] = useState(null);

  // Driver balance (optional)
  const [driverBalance, setDriverBalance] = useState(null);

  // Rides list
  const [rides, setRides] = useState([]);
  const [selectedRideId, setSelectedRideId] = useState(null);

  // Bookings for selected ride
  const [bookings, setBookings] = useState([]);

  const pendingBookings = useMemo(() => bookings.filter((b) => b.status === "pending"), [bookings]);
  const acceptedBookings = useMemo(() => bookings.filter((b) => b.status === "accepted"), [bookings]);

  const selectedRide = useMemo(() => rides.find((r) => r.id === selectedRideId) || null, [rides, selectedRideId]);
  const rideIsCompleted = selectedRide?.status === "completed";
  const rideIsCancelled = selectedRide?.status === "cancelled";

  // Create ride form
  const [form, setForm] = useState({
    fromRegion: null,
    fromDistrict: null,
    toRegion: null,
    toDistrict: null,
    rideDate: null,
    rideTime: null,
    seats: 1,
    price: 0,
    pickup_mode: "meet_point",

    // ✅ New: delivery service
    delivery_service: false,

    // ✅ only ONE required "ketish" point:
    meet_lat: null,
    meet_lng: null,
    meet_address: "",

    // optional dest
    dest_lat: null,
    dest_lng: null,
    dest_address: "",
  });

  // Map modal
  const [mapModal, setMapModal] = useState({ open: false, title: "", url: "" });

  // Safe: won't crash if referenced
  const prepareReturnDraft = () => {
    message.info("Qaytish yo‘nalishi: yo‘nalishlar almashtirildi");
    setForm((p) => ({
      ...p,
      fromRegion: p.toRegion,
      fromDistrict: p.toDistrict,
      toRegion: p.fromRegion,
      toDistrict: p.fromDistrict,
      meet_lat: p.dest_lat,
      meet_lng: p.dest_lng,
      meet_address: p.dest_address,
      dest_lat: p.meet_lat,
      dest_lng: p.meet_lng,
      dest_address: p.meet_address,
    }));
    setTimeout(() => formRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" }), 150);
  };

  const openMapEmbed = ({ title, lat, lng, mode = "pin", sLat = null, sLng = null }) => {
    const url = safeMapUrl({ lat, lng, mode, sLat, sLng });
    if (!url) return message.warning("Lokatsiya topilmadi");
    setMapModal({ open: true, title, url });
  };

  const getMyLocation = async () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      message.error("Geolokatsiya qo‘llab-quvvatlanmaydi");
      return null;
    }
    return await new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });
  };

  const refreshSession = async () => {
    const { data } = await supabase.auth.getSession();
    setSession(data?.session || null);
    return data?.session || null;
  };

  const loadDriverBalance = async (uid) => {
    try {
      const { data, error } = await supabase.from("driver_wallets").select("balance").eq("driver_id", uid).maybeSingle();
      if (error) return;
      if (data && typeof data.balance !== "undefined") setDriverBalance(data.balance);
    } catch {
      // ignore
    }
  };

  const loadMyRides = async (uid) => {
    const { data, error } = await supabase
      .from(RIDES_TABLE)
      .select("*")
      .eq("driver_id", uid)
      .order("created_at", { ascending: false });

    if (error) {
      message.error(`Ride yuklash xatosi: ${error.message}`);
      return [];
    }
    setRides(data || []);
    if (!selectedRideId && data?.[0]?.id) setSelectedRideId(data[0].id);
    return data || [];
  };

  const loadBookingsForRide = async (rideId) => {
    if (!rideId) {
      setBookings([]);
      return [];
    }

    // ✅ ketma-ketlik: created_at ascending (old -> new)
    const { data, error } = await supabase
      .from(BOOKINGS_TABLE)
      .select("*")
      .eq("ride_id", rideId)
      .order("created_at", { ascending: true });

    if (error) {
      message.error(`Booking yuklash xatosi: ${error.message}`);
      return [];
    }
    setBookings(data || []);
    return data || [];
  };

  const createRide = async () => {
    const uid = session?.user?.id;
    if (!uid) return message.error("Login qiling");

    if (!form.fromRegion || !form.toRegion) return message.warning("Viloyatlarni tanlang");
    if (!form.rideDate) return message.warning("Sanani tanlang");
    if (!form.rideTime) return message.warning("Vaqtni tanlang");

    if (!form.meet_lat || !form.meet_lng) return message.warning("Ketish lokatsiyasini belgilang (GPS yoki lat/lng)");

    const payload = {
      driver_id: uid,
      from_region: form.fromRegion,
      from_district: form.fromDistrict,
      to_region: form.toRegion,
      to_district: form.toDistrict,
      pickup_location: `${form.fromRegion}${form.fromDistrict ? ", " + form.fromDistrict : ""}`,
      dropoff_location: `${form.toRegion}${form.toDistrict ? ", " + form.toDistrict : ""}`,
      pickup_mode: form.pickup_mode,
      delivery_service: !!form.delivery_service,

      meet_lat: form.meet_lat,
      meet_lng: form.meet_lng,
      meet_address: form.meet_address || null,

      dest_lat: form.dest_lat,
      dest_lng: form.dest_lng,
      dest_address: form.dest_address || null,

      seats: Number(form.seats || 1),
      price: Number(form.price || 0),

      ride_date: dayjs(form.rideDate).format("YYYY-MM-DD"),
      ride_time: dayjs(form.rideTime).format("HH:mm:ss"),
      status: "active",
    };

    const { data, error } = await supabase.from(RIDES_TABLE).insert(payload).select("*").single();
    if (error) return message.error(`Saqlash xatosi: ${error.message}`);

    message.success("E’lon yaratildi");
    const updated = [data, ...rides];
    setRides(updated);
    setSelectedRideId(data.id);
  };

  const updateRideStatus = async (rideId, status) => {
    const { error } = await supabase.from(RIDES_TABLE).update({ status }).eq("id", rideId);
    if (error) return message.error(`Status o‘zgartirish xatosi: ${error.message}`);

    setRides((prev) => prev.map((r) => (r.id === rideId ? { ...r, status } : r)));
    message.success("Status yangilandi");
  };

  const acceptBooking = async (bookingId) => {
    if (ACCEPT_FEE_SUM > 0) {
      const bal = Number(driverBalance || 0);
      if (bal < ACCEPT_FEE_SUM) {
        return message.error(`Balans yetarli emas. Qabul qilish narxi: ${fmtMoney(ACCEPT_FEE_SUM)} so‘m`);
      }
    }

    const { error } = await supabase.rpc(ACCEPT_RPC, { booking_id: bookingId });
    if (error) return message.error(`Qabul qilish xatosi: ${error.message}`);

    message.success("Qabul qilindi");
    await loadBookingsForRide(selectedRideId);
  };

  const rejectBooking = async (bookingId) => {
    const { error } = await supabase.rpc(REJECT_RPC, { booking_id: bookingId });
    if (error) return message.error(`Rad etish xatosi: ${error.message}`);

    message.success("Rad etildi");
    await loadBookingsForRide(selectedRideId);
  };

  const refreshAll = async () => {
    const uid = session?.user?.id;
    if (!uid) return;
    await loadDriverBalance(uid);
    await loadMyRides(uid);
    await loadBookingsForRide(selectedRideId);
    message.success("Yangilandi");
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      const s = await refreshSession();
      if (s?.user?.id) {
        await loadDriverBalance(s.user.id);
        const r = await loadMyRides(s.user.id);
        const firstRideId = selectedRideId || r?.[0]?.id || null;
        if (firstRideId) await loadBookingsForRide(firstRideId);
      }
      setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async () => {
      const s = await refreshSession();
      if (s?.user?.id) {
        await loadDriverBalance(s.user.id);
        const r = await loadMyRides(s.user.id);
        const firstRideId = r?.[0]?.id || null;
        setSelectedRideId(firstRideId);
        if (firstRideId) await loadBookingsForRide(firstRideId);
      } else {
        setRides([]);
        setBookings([]);
      }
    });

    return () => sub?.subscription?.unsubscribe?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    (async () => {
      if (!session?.user?.id) return;
      await loadBookingsForRide(selectedRideId);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRideId]);

  useEffect(() => {
    if (!selectedRideId) return;

    const channel = supabase
      .channel(`driver_interprov_bookings_${selectedRideId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: BOOKINGS_TABLE, filter: `ride_id=eq.${selectedRideId}` },
        async () => {
          await loadBookingsForRide(selectedRideId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRideId]);

  if (loading) {
    return (
      <div style={{ padding: 16 }}>
        <Skeleton active />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div style={{ padding: 16 }}>
        <Card>
          <Title level={4}>Haydovchi paneli</Title>
          <Text type="secondary">Davom etish uchun login qiling.</Text>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, maxWidth: 1100, margin: "0 auto" }}>
      <Row justify="space-between" align="middle">
        <Col>
          <Title level={4} style={{ margin: 0 }}>
            Tumanlar/Viloyatlararo — Haydovchi
          </Title>
          <Text type="secondary">SERVICE_TYPE: INTER_PROV</Text>
          <br />
          <Text type="secondary">
            Tablelar: {RIDES_TABLE} / {BOOKINGS_TABLE}
          </Text>
        </Col>
        <Col>
          <Space>
            <Tag color="blue">Balans: {fmtMoney(driverBalance)} so‘m</Tag>
            <Tag color={ACCEPT_FEE_SUM > 0 ? "orange" : "green"}>Qabul narxi: {fmtMoney(ACCEPT_FEE_SUM)} so‘m</Tag>
            <Button icon={<ReloadOutlined />} onClick={refreshAll}>
              Yangilash
            </Button>
          </Space>
        </Col>
      </Row>

      <Divider />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={10}>
          <div ref={formRef} />
          <Card
            title={
              <Space>
                <PlusOutlined />
                <span>Yangi e’lon</span>
              </Space>
            }
            extra={
              <Button onClick={prepareReturnDraft} size="small">
                Qaytish e’lon
              </Button>
            }
          >
            <Row gutter={[12, 12]}>
              <Col span={12}>
                <Text type="secondary">Qayerdan</Text>
                <Select
                  style={{ width: "100%", marginTop: 6 }}
                  placeholder="Viloyat"
                  options={regionOptions}
                  value={form.fromRegion}
                  onChange={(v) => setForm((p) => ({ ...p, fromRegion: v, fromDistrict: null }))}
                />
              </Col>
              <Col span={12}>
                <Text type="secondary">Tuman (ixtiyoriy)</Text>
                <Select
                  style={{ width: "100%", marginTop: 6 }}
                  placeholder="Tuman"
                  options={districtsByRegion(form.fromRegion)}
                  value={form.fromDistrict}
                  onChange={(v) => setForm((p) => ({ ...p, fromDistrict: v }))}
                  allowClear
                />
              </Col>

              <Col span={12}>
                <Text type="secondary">Qayerga</Text>
                <Select
                  style={{ width: "100%", marginTop: 6 }}
                  placeholder="Viloyat"
                  options={regionOptions}
                  value={form.toRegion}
                  onChange={(v) => setForm((p) => ({ ...p, toRegion: v, toDistrict: null }))}
                />
              </Col>
              <Col span={12}>
                <Text type="secondary">Tuman (ixtiyoriy)</Text>
                <Select
                  style={{ width: "100%", marginTop: 6 }}
                  placeholder="Tuman"
                  options={districtsByRegion(form.toRegion)}
                  value={form.toDistrict}
                  onChange={(v) => setForm((p) => ({ ...p, toDistrict: v }))}
                  allowClear
                />
              </Col>

              <Col span={12}>
                <Text type="secondary">
                  <CalendarOutlined /> Sana
                </Text>
                <DatePicker
                  style={{ width: "100%", marginTop: 6 }}
                  value={form.rideDate ? dayjs(form.rideDate) : null}
                  onChange={(d) => setForm((p) => ({ ...p, rideDate: d ? d.toDate() : null }))}
                  disabledDate={(c) => c && c < dayjs().startOf("day")}
                />
              </Col>
              <Col span={12}>
                <Text type="secondary">
                  <ClockCircleOutlined /> Vaqt
                </Text>
                <TimePicker
                  style={{ width: "100%", marginTop: 6 }}
                  value={form.rideTime ? dayjs(form.rideTime) : null}
                  onChange={(t) => setForm((p) => ({ ...p, rideTime: t ? t.toDate() : null }))}
                  format="HH:mm"
                />
              </Col>

              <Col span={12}>
                <Text type="secondary">O‘rinlar</Text>
                <InputNumber
                  style={{ width: "100%", marginTop: 6 }}
                  min={1}
                  max={10}
                  value={form.seats}
                  onChange={(v) => setForm((p) => ({ ...p, seats: v || 1 }))}
                />
              </Col>
              <Col span={12}>
                <Text type="secondary">Narx (so‘m)</Text>
                <InputNumber
                  style={{ width: "100%", marginTop: 6 }}
                  min={0}
                  step={1000}
                  value={form.price}
                  onChange={(v) => setForm((p) => ({ ...p, price: v || 0 }))}
                />
              </Col>


              <Col span={24}>
                <Space align="center">
                  <Text strong>Eltish xizmati</Text>
                  <Switch checked={!!form.delivery_service} onChange={(checked) => setForm((p) => ({ ...p, delivery_service: checked }))} />
                </Space>
                <div style={{ marginTop: 6 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Belgilasangiz, bu e’lon yo‘lovchi tarafda “Eltish xizmati” sahifasida ham ko‘rinadi.
                  </Text>
                </div>
              </Col>

              <Col span={24}>
                <Divider style={{ margin: "10px 0" }} />
                <Text strong>
                  <EnvironmentFilled /> Ketish joyi (bitta, shart)
                </Text>
                <Row gutter={[8, 8]} style={{ marginTop: 8 }}>
                  <Col span={16}>
                    <Input
                      placeholder="Ketish address (ixtiyoriy)"
                      value={form.meet_address}
                      onChange={(e) => setForm((p) => ({ ...p, meet_address: e.target.value }))}
                    />
                  </Col>
                  <Col span={8}>
                    <Button
                      icon={<AimOutlined />}
                      block
                      onClick={async () => {
                        const loc = await getMyLocation();
                        if (!loc) return message.error("Lokatsiya olinmadi");
                        setForm((p) => ({ ...p, meet_lat: loc.lat, meet_lng: loc.lng }));
                        message.success("Ketish lokatsiyasi belgilandi");
                      }}
                    >
                      Meniki
                    </Button>
                  </Col>
                  <Col span={12}>
                    <Input
                      placeholder="meet_lat"
                      value={form.meet_lat ?? ""}
                      onChange={(e) => setForm((p) => ({ ...p, meet_lat: e.target.value ? Number(e.target.value) : null }))}
                    />
                  </Col>
                  <Col span={12}>
                    <Input
                      placeholder="meet_lng"
                      value={form.meet_lng ?? ""}
                      onChange={(e) => setForm((p) => ({ ...p, meet_lng: e.target.value ? Number(e.target.value) : null }))}
                    />
                  </Col>

                  <Col span={24}>
                    <Space>
                      <Button onClick={() => openMapEmbed({ title: "Ketish joyi", lat: form.meet_lat, lng: form.meet_lng, mode: "pin" })}>
                        Xarita
                      </Button>
                      <Button
                        type="primary"
                        onClick={() =>
                          openMapEmbed({
                            title: "Yo‘l (ketish joyi)",
                            lat: form.meet_lat,
                            lng: form.meet_lng,
                            mode: "route",
                          })
                        }
                      >
                        Yo‘l
                      </Button>
                    </Space>
                  </Col>
                </Row>
              </Col>

              <Col span={24}>
                <Divider style={{ margin: "10px 0" }} />
                <Text strong>
                  <EnvironmentFilled /> Borish joyi (ixtiyoriy)
                </Text>
                <Row gutter={[8, 8]} style={{ marginTop: 8 }}>
                  <Col span={16}>
                    <Input
                      placeholder="Borish address (ixtiyoriy)"
                      value={form.dest_address}
                      onChange={(e) => setForm((p) => ({ ...p, dest_address: e.target.value }))}
                    />
                  </Col>
                  <Col span={8}>
                    <Button
                      icon={<AimOutlined />}
                      block
                      onClick={async () => {
                        const loc = await getMyLocation();
                        if (!loc) return message.error("Lokatsiya olinmadi");
                        setForm((p) => ({ ...p, dest_lat: loc.lat, dest_lng: loc.lng }));
                        message.success("Borish lokatsiyasi belgilandi");
                      }}
                    >
                      Meniki
                    </Button>
                  </Col>
                  <Col span={12}>
                    <Input
                      placeholder="dest_lat"
                      value={form.dest_lat ?? ""}
                      onChange={(e) => setForm((p) => ({ ...p, dest_lat: e.target.value ? Number(e.target.value) : null }))}
                    />
                  </Col>
                  <Col span={12}>
                    <Input
                      placeholder="dest_lng"
                      value={form.dest_lng ?? ""}
                      onChange={(e) => setForm((p) => ({ ...p, dest_lng: e.target.value ? Number(e.target.value) : null }))}
                    />
                  </Col>

                  <Col span={24}>
                    <Space>
                      <Button onClick={() => openMapEmbed({ title: "Borish joyi", lat: form.dest_lat, lng: form.dest_lng, mode: "pin" })}>
                        Xarita
                      </Button>
                      <Button
                        type="primary"
                        onClick={() =>
                          openMapEmbed({
                            title: "Yo‘l (borish joyi)",
                            lat: form.dest_lat,
                            lng: form.dest_lng,
                            mode: "route",
                          })
                        }
                      >
                        Yo‘l
                      </Button>
                    </Space>
                  </Col>
                </Row>
              </Col>

              <Col span={24}>
                <Divider style={{ margin: "10px 0" }} />
                <Button type="primary" block onClick={createRide}>
                  E’lonni saqlash
                </Button>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} md={14}>
          <Card
            title={
              <Space>
                <span>Mening e’lonlarim</span>
                <Badge count={rides.length} showZero />
              </Space>
            }
          >
            {rides.length === 0 ? (
              <Text type="secondary">Hozircha e’lon yo‘q.</Text>
            ) : (
              <Space direction="vertical" style={{ width: "100%" }}>
                <Select
                  style={{ width: "100%" }}
                  value={selectedRideId}
                  onChange={setSelectedRideId}
                  options={rides.map((r) => ({
                    value: r.id,
                    label: `${r.from_region || ""} → ${r.to_region || ""}${r.delivery_service ? " • ELTISH" : ""} • ${r.ride_date || ""} ${String(r.ride_time || "").slice(0, 5)} • ${fmtMoney(r.price)} so‘m • ${r.status}`,
                  }))}
                />

                {selectedRide ? (
                  <Card size="small" style={{ background: "rgba(0,0,0,0.02)" }}>
                    <Row gutter={[10, 10]} align="middle">
                      <Col flex="auto">
                        <Space wrap>
                          <Tag color={rideIsCompleted ? "green" : rideIsCancelled ? "red" : "blue"}>
                            {rideIsCompleted ? "TUGAGAN" : rideIsCancelled ? "BEKOR QILINGAN" : "AKTIV"}
                          </Tag>
                          <Text strong>
                            {selectedRide.from_region} → {selectedRide.to_region}
                          </Text>
                          <Tag>{fmtMoney(selectedRide.price)} so‘m</Tag>
                          {selectedRide.delivery_service ? <Tag color="purple">ELTISH XIZMATI</Tag> : null}
                        </Space>
                      </Col>

                      <Col>
                        {!rideIsCompleted ? (
                          <Space wrap>
                            <Button icon={<EditOutlined />} onClick={() => message.info("Tahrirlash: keyingi versiyada (hozircha)")} >
                              E’lonni tahrirlash
                            </Button>

                            <Popconfirm
                              title="E’lonni bekor qilasizmi?"
                              okText="Ha"
                              cancelText="Yo‘q"
                              onConfirm={() => updateRideStatus(selectedRide.id, "cancelled")}
                            >
                              <Button danger icon={<StopOutlined />}>
                                E’lonni bekor qilish
                              </Button>
                            </Popconfirm>

                            <Button
                              type="primary"
                              icon={<CheckCircleOutlined />}
                              onClick={() => updateRideStatus(selectedRide.id, "completed")}
                            >
                              Manzilga yetib keldik
                            </Button>
                          </Space>
                        ) : (
                          <div style={{ width: 360, maxWidth: "100%" }}>
                            <Button type="primary" size="large" block icon={<CheckCircleOutlined />} disabled>
                              MANZILGA YETIB KELDIK
                            </Button>
                            <Button style={{ marginTop: 10 }} block onClick={prepareReturnDraft}>
                              Qayta buyurtma yaratish
                            </Button>
                          </div>
                        )}
                      </Col>
                    </Row>
                  </Card>
                ) : null}

                <Tabs
                  items={[
                    {
                      key: "pending",
                      label: (
                        <Space>
                          <span>So‘rovlar</span>
                          <Badge count={pendingBookings.length} showZero />
                        </Space>
                      ),
                      children: (
                        <List
                          dataSource={pendingBookings}
                          locale={{ emptyText: "Hozircha bron so‘rovlar yo‘q" }}
                          renderItem={(b) => (
                            <List.Item
                              actions={[
                                <AcceptButtonWithNote
                                  key="accept"
                                  disabled={rideIsCompleted || rideIsCancelled}
                                  onAccept={() => acceptBooking(b.id)}
                                />,
                                <Button
                                  key="reject"
                                  danger
                                  icon={<CloseOutlined />}
                                  disabled={rideIsCompleted || rideIsCancelled}
                                  onClick={() => rejectBooking(b.id)}
                                >
                                  Rad
                                </Button>,
                                <Button
                                  key="map"
                                  onClick={() =>
                                    openMapEmbed({
                                      title: "Yo‘lovchi lokatsiyasi (pin)",
                                      lat: b.pickup_lat,
                                      lng: b.pickup_lng,
                                      mode: "pin",
                                    })
                                  }
                                >
                                  Xarita
                                </Button>,
                              ]}
                            >
                              <List.Item.Meta
                                avatar={<UserOutlined />}
                                title={
                                  <Space wrap>
                                    <Text strong>{b.passenger_phone || "Yo‘lovchi"}</Text>
                                    <Tag>{b.passenger_gender || "—"}</Tag>
                                    <Tag color="blue">{b.seats} o‘rin</Tag>
                                    <Tag color="gold">{b.status}</Tag>
                                  </Space>
                                }
                                description={
                                  <div>
                                    <Text type="secondary">
                                      Lokatsiya:{" "}
                                      <Button
                                        type="link"
                                        style={{ padding: 0, height: "auto" }}
                                        onClick={() =>
                                          openMapEmbed({
                                            title: "Yo‘lovchiga yo‘l (navigator)",
                                            lat: b.pickup_lat,
                                            lng: b.pickup_lng,
                                            mode: "route",
                                            sLat: selectedRide?.meet_lat,
                                            sLng: selectedRide?.meet_lng,
                                          })
                                        }
                                      >
                                        {b.pickup_address || `${b.pickup_lat || ""}, ${b.pickup_lng || ""}` || "—"}
                                      </Button>
                                    </Text>
                                    <br />
                                    <Text type="secondary">
                                      Yuborilgan: {b.created_at ? dayjs(b.created_at).format("YYYY-MM-DD HH:mm") : "—"}
                                    </Text>
                                  </div>
                                }
                              />
                            </List.Item>
                          )}
                        />
                      ),
                    },
                    {
                      key: "accepted",
                      label: (
                        <Space>
                          <span>Qabul qilinganlar</span>
                          <Badge count={acceptedBookings.length} showZero />
                        </Space>
                      ),
                      children: (
                        <List
                          dataSource={acceptedBookings}
                          locale={{ emptyText: "Qabul qilingan yo‘lovchi yo‘q" }}
                          renderItem={(b) => (
                            <List.Item
                              actions={[
                                <Button
                                  key="route"
                                  type="primary"
                                  onClick={() =>
                                    openMapEmbed({
                                      title: "Yo‘lovchiga yo‘l (navigator)",
                                      lat: b.pickup_lat,
                                      lng: b.pickup_lng,
                                      mode: "route",
                                      sLat: selectedRide?.meet_lat,
                                      sLng: selectedRide?.meet_lng,
                                    })
                                  }
                                >
                                  Yo‘l ko‘rsatish
                                </Button>,
                                <Button
                                  key="pin"
                                  onClick={() =>
                                    openMapEmbed({
                                      title: "Yo‘lovchi lokatsiyasi (pin)",
                                      lat: b.pickup_lat,
                                      lng: b.pickup_lng,
                                      mode: "pin",
                                    })
                                  }
                                >
                                  Xarita
                                </Button>,
                              ]}
                            >
                              <List.Item.Meta
                                avatar={<UserOutlined />}
                                title={
                                  <Space wrap>
                                    <Text strong>{b.passenger_phone || "Yo‘lovchi"}</Text>
                                    <Tag color="green">accepted</Tag>
                                    <Tag>{b.passenger_gender || "—"}</Tag>
                                    <Tag color="blue">{b.seats} o‘rin</Tag>
                                  </Space>
                                }
                                description={
                                  <div>
                                    <Text type="secondary">
                                      Lokatsiya:{" "}
                                      <Button
                                        type="link"
                                        style={{ padding: 0, height: "auto" }}
                                        onClick={() =>
                                          openMapEmbed({
                                            title: "Yo‘lovchiga yo‘l (navigator)",
                                            lat: b.pickup_lat,
                                            lng: b.pickup_lng,
                                            mode: "route",
                                            sLat: selectedRide?.meet_lat,
                                            sLng: selectedRide?.meet_lng,
                                          })
                                        }
                                      >
                                        {b.pickup_address || `${b.pickup_lat || ""}, ${b.pickup_lng || ""}` || "—"}
                                      </Button>
                                    </Text>
                                    <br />
                                    <Text type="secondary">
                                      Qabul vaqti: {b.accepted_at ? dayjs(b.accepted_at).format("YYYY-MM-DD HH:mm") : "—"}
                                    </Text>
                                  </div>
                                }
                              />
                            </List.Item>
                          )}
                        />
                      ),
                    },
                  ]}
                />
              </Space>
            )}
          </Card>
        </Col>
      </Row>

      <Modal open={mapModal.open} title={mapModal.title} footer={null} width={900} onCancel={() => setMapModal({ open: false, title: "", url: "" })}>
        <iframe src={mapModal.url} width="100%" height="520" style={{ border: 0 }} loading="lazy" />
      </Modal>
    </div>
  );
}
