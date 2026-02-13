import React, { useEffect, useState } from "react";
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
  Divider,
  Modal,
  Input,
  List,
  Badge,
  Tabs,
} from "antd";
import {
  EnvironmentFilled,
  CalendarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  SearchOutlined,
  AimOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { supabase } from "../../../../lib/supabase";

const { Title, Text } = Typography;

const RIDES_TABLE = "inter_prov_rides";
const BOOKINGS_TABLE = "inter_prov_bookings";

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
  if (mode === "route" && sLat && sLng) return `https://www.google.com/maps?saddr=${sLat},${sLng}&daddr=${lat},${lng}&output=embed`;
  return `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`;
};

export default function ClientInterProvincial() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  const [filters, setFilters] = useState({
    fromRegion: null,
    fromDistrict: null,
    toRegion: null,
    toDistrict: null,
    date: null,
  });

  const [activeTab, setActiveTab] = useState("rides");

  const [rides, setRides] = useState([]);
  const [myBookings, setMyBookings] = useState([]);

  const [bookingModal, setBookingModal] = useState({ open: false, ride: null });
  const [bookingForm, setBookingForm] = useState({
    seats: 1,
    passenger_phone: "",
    passenger_gender: "",
    pickup_lat: null,
    pickup_lng: null,
    pickup_address: "",
  });

  const [mapModal, setMapModal] = useState({ open: false, title: "", url: "" });

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

  const loadMyBookings = async (uid) => {
    const { data, error } = await supabase
      .from(BOOKINGS_TABLE)
      .select("*")
      .eq("passenger_id", uid)
      .order("created_at", { ascending: false });
    if (!error) setMyBookings(data || []);
  };

  const searchRides = async () => {
    setLoading(true);

    let q = supabase
      .from(RIDES_TABLE)
      .select("*")
      .eq("status", "active")
      .eq("delivery_service", activeTab === "delivery")
      .order("ride_date", { ascending: true });

    if (filters.fromRegion) q = q.eq("from_region", filters.fromRegion);
    if (filters.fromDistrict) q = q.eq("from_district", filters.fromDistrict);
    if (filters.toRegion) q = q.eq("to_region", filters.toRegion);
    if (filters.toDistrict) q = q.eq("to_district", filters.toDistrict);
    if (filters.date) q = q.eq("ride_date", dayjs(filters.date).format("YYYY-MM-DD"));

    const { data, error } = await q;
    if (error) {
      message.error(`Qidiruv xatosi: ${error.message}`);
      setLoading(false);
      return;
    }
    setRides(data || []);
    setLoading(false);
  };

  const openBooking = (ride) => {
    setBookingForm({
      seats: 1,
      passenger_phone: "",
      passenger_gender: "",
      pickup_lat: null,
      pickup_lng: null,
      pickup_address: "",
    });
    setBookingModal({ open: true, ride });
  };

  const submitBooking = async () => {
    const uid = session?.user?.id;
    if (!uid) return message.error("Login qiling");

    const ride = bookingModal.ride;
    if (!ride?.id) return;

    if (!bookingForm.pickup_lat || !bookingForm.pickup_lng) return message.warning("Pickup lokatsiyani belgilang");

    const payload = {
      ride_id: ride.id,
      passenger_id: uid,
      passenger_phone: bookingForm.passenger_phone || null,
      passenger_gender: bookingForm.passenger_gender || null,
      seats: Number(bookingForm.seats || 1),
      pickup_lat: Number(bookingForm.pickup_lat),
      pickup_lng: Number(bookingForm.pickup_lng),
      pickup_address: bookingForm.pickup_address || null,
      status: "pending",
    };

    const { error } = await supabase.from(BOOKINGS_TABLE).insert(payload);
    if (error) return message.error(`So‘rov yuborish xatosi: ${error.message}`);

    message.success("So‘rov yuborildi");
    setBookingModal({ open: false, ride: null });
    await loadMyBookings(uid);
  };

  useEffect(() => {
    (async () => {
      const s = await refreshSession();
      if (s?.user?.id) await loadMyBookings(s.user.id);
      await searchRides();
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async () => {
      const s = await refreshSession();
      if (s?.user?.id) await loadMyBookings(s.user.id);
    });

    return () => sub?.subscription?.unsubscribe?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  useEffect(() => {
    // Tab o‘zgarganda qayta qidiramiz
    searchRides();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  if (loading) {
    return (
      <div style={{ padding: 16 }}>
        <Skeleton active />
      </div>
    );
  }

  return (
    <div style={{ padding: 16, maxWidth: 1100, margin: "0 auto" }}>
      <Title level={4} style={{ margin: 0 }}>
        Yo‘lovchi — Viloyatlararo
      </Title>
      <Text type="secondary">Tablelar: {RIDES_TABLE} / {BOOKINGS_TABLE}</Text>

      <Divider />

      <Card
        title={
          <Space>
            <SearchOutlined />
            <span>Qidiruv</span>
          </Space>
        }
        extra={
          <Button type="primary" onClick={searchRides}>
            Qidirish
          </Button>
        }
      >
        <Row gutter={[12, 12]}>
          <Col xs={24} md={6}>
            <Text type="secondary">Qayerdan</Text>
            <Select
              style={{ width: "100%", marginTop: 6 }}
              placeholder="Viloyat"
              options={regionOptions}
              value={filters.fromRegion}
              onChange={(v) => setFilters((p) => ({ ...p, fromRegion: v, fromDistrict: null }))}
              allowClear
            />
          </Col>
          <Col xs={24} md={6}>
            <Text type="secondary">Tuman</Text>
            <Select
              style={{ width: "100%", marginTop: 6 }}
              placeholder="Tuman"
              options={districtsByRegion(filters.fromRegion)}
              value={filters.fromDistrict}
              onChange={(v) => setFilters((p) => ({ ...p, fromDistrict: v }))}
              allowClear
            />
          </Col>

          <Col xs={24} md={6}>
            <Text type="secondary">Qayerga</Text>
            <Select
              style={{ width: "100%", marginTop: 6 }}
              placeholder="Viloyat"
              options={regionOptions}
              value={filters.toRegion}
              onChange={(v) => setFilters((p) => ({ ...p, toRegion: v, toDistrict: null }))}
              allowClear
            />
          </Col>
          <Col xs={24} md={6}>
            <Text type="secondary">Tuman</Text>
            <Select
              style={{ width: "100%", marginTop: 6 }}
              placeholder="Tuman"
              options={districtsByRegion(filters.toRegion)}
              value={filters.toDistrict}
              onChange={(v) => setFilters((p) => ({ ...p, toDistrict: v }))}
              allowClear
            />
          </Col>

          <Col xs={24} md={6}>
            <Text type="secondary">
              <CalendarOutlined /> Sana
            </Text>
            <DatePicker
              style={{ width: "100%", marginTop: 6 }}
              value={filters.date ? dayjs(filters.date) : null}
              onChange={(d) => setFilters((p) => ({ ...p, date: d ? d.toDate() : null }))}
              disabledDate={(c) => c && c < dayjs().startOf("day")}
              allowClear
            />
          </Col>
        </Row>
      </Card>

      <Divider />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={14}>
          <Card
            title={
              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={[
                  {
                    key: "rides",
                    label: (
                      <Space>
                        <span>Yo‘lovchi</span>
                        <Badge count={activeTab === "rides" ? rides.length : 0} showZero />
                      </Space>
                    ),
                  },
                  {
                    key: "delivery",
                    label: (
                      <Space>
                        <span>Eltish xizmati</span>
                        <Badge count={activeTab === "delivery" ? rides.length : 0} showZero />
                      </Space>
                    ),
                  },
                ]}
              />
            }
          >
            <List
              dataSource={rides}
              locale={{ emptyText: "E’lon topilmadi" }}
              renderItem={(r) => (
                <List.Item
                  actions={[
                    <Button key="map" onClick={() => openMapEmbed({ title: "Ketish joyi", lat: r.meet_lat, lng: r.meet_lng })}>
                      Xarita
                    </Button>,
                    <Button key="book" type="primary" onClick={() => openBooking(r)}>
                      So‘rov yuborish
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={<EnvironmentFilled />}
                    title={
                      <Space wrap>
                        <Text strong>
                          {r.from_region || "—"} → {r.to_region || "—"}
                        </Text>
                        <Tag color="blue">{fmtMoney(r.price)} so‘m</Tag>
                        {r.delivery_service ? <Tag color="purple">ELTISH</Tag> : null}
                        <Tag>{r.seats} o‘rin</Tag>
                      </Space>
                    }
                    description={
                      <div>
                        <Text type="secondary">
                          <CalendarOutlined /> {r.ride_date || "—"} &nbsp;&nbsp;
                          <ClockCircleOutlined /> {String(r.ride_time || "").slice(0, 5) || "—"}
                        </Text>
                        <br />
                        <Text type="secondary">Ketish: {r.meet_address || "—"}</Text>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} md={10}>
          <Card
            title={
              <Space>
                <UserOutlined />
                <span>Mening so‘rovlarim</span>
                <Badge count={myBookings.length} showZero />
              </Space>
            }
            extra={
              <Button
                onClick={async () => {
                  const uid = session?.user?.id;
                  if (!uid) return message.error("Login qiling");
                  await loadMyBookings(uid);
                  message.success("Yangilandi");
                }}
              >
                Yangilash
              </Button>
            }
          >
            {!session?.user ? (
              <Text type="secondary">Login qilsangiz so‘rovlaringiz ko‘rinadi.</Text>
            ) : (
              <List
                dataSource={myBookings}
                locale={{ emptyText: "So‘rov yo‘q" }}
                renderItem={(b) => (
                  <List.Item
                    actions={[
                      <Button key="map" onClick={() => openMapEmbed({ title: "Mening pickup", lat: b.pickup_lat, lng: b.pickup_lng })}>
                        Xarita
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<UserOutlined />}
                      title={
                        <Space wrap>
                          <Text strong>{b.passenger_phone || "Men"}</Text>
                          <Tag color={b.status === "accepted" ? "green" : b.status === "rejected" ? "red" : "gold"}>
                            {b.status}
                          </Tag>
                          <Tag>{b.seats} o‘rin</Tag>
                        </Space>
                      }
                      description={
                        <div>
                          <Text type="secondary">Pickup: {b.pickup_address || "—"}</Text>
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
            )}
          </Card>
        </Col>
      </Row>

      <Modal open={bookingModal.open} title="So‘rov yuborish" okText="Yuborish" onOk={submitBooking} onCancel={() => setBookingModal({ open: false, ride: null })}>
        <Space direction="vertical" style={{ width: "100%" }}>
          <Text type="secondary">Telefon (ixtiyoriy)</Text>
          <Input value={bookingForm.passenger_phone} onChange={(e) => setBookingForm((p) => ({ ...p, passenger_phone: e.target.value }))} placeholder="+998..." />

          <Text type="secondary">Jins (ixtiyoriy)</Text>
          <Input value={bookingForm.passenger_gender} onChange={(e) => setBookingForm((p) => ({ ...p, passenger_gender: e.target.value }))} placeholder="Erkak / Ayol" />

          <Text type="secondary">O‘rinlar</Text>
          <InputNumber style={{ width: "100%" }} min={1} max={10} value={bookingForm.seats} onChange={(v) => setBookingForm((p) => ({ ...p, seats: v || 1 }))} />

          <Divider />

          <Text strong>
            <EnvironmentFilled /> Pickup lokatsiya
          </Text>

          <Button
            icon={<AimOutlined />}
            onClick={async () => {
              const loc = await getMyLocation();
              if (!loc) return message.error("Lokatsiya olinmadi");
              setBookingForm((p) => ({ ...p, pickup_lat: loc.lat, pickup_lng: loc.lng }));
              message.success("Pickup lokatsiya belgilandi");
            }}
          >
            Meniki (GPS)
          </Button>

          <Row gutter={[8, 8]}>
            <Col span={12}>
              <Input placeholder="pickup_lat" value={bookingForm.pickup_lat ?? ""} onChange={(e) => setBookingForm((p) => ({ ...p, pickup_lat: e.target.value ? Number(e.target.value) : null }))} />
            </Col>
            <Col span={12}>
              <Input placeholder="pickup_lng" value={bookingForm.pickup_lng ?? ""} onChange={(e) => setBookingForm((p) => ({ ...p, pickup_lng: e.target.value ? Number(e.target.value) : null }))} />
            </Col>
          </Row>

          <Input placeholder="Pickup address (ixtiyoriy)" value={bookingForm.pickup_address} onChange={(e) => setBookingForm((p) => ({ ...p, pickup_address: e.target.value }))} />

          <Space>
            <Button onClick={() => openMapEmbed({ title: "Pickup lokatsiya", lat: bookingForm.pickup_lat, lng: bookingForm.pickup_lng })}>Xarita</Button>
          </Space>

          {bookingModal.ride ? (
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">Tanlangan e’lon:</Text>
              <br />
              <Tag color="blue">
                {bookingModal.ride.from_region} → {bookingModal.ride.to_region}
              </Tag>
              <Tag>{fmtMoney(bookingModal.ride.price)} so‘m</Tag>
            </div>
          ) : null}
        </Space>
      </Modal>

      <Modal open={mapModal.open} title={mapModal.title} footer={null} width={900} onCancel={() => setMapModal({ open: false, title: "", url: "" })}>
        <iframe src={mapModal.url} width="100%" height="520" style={{ border: 0 }} loading="lazy" />
      </Modal>
    </div>
  );
}
