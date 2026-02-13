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
  Popconfirm,
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
  DeleteOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { supabase } from "../../../lib/supabase";

const { Title, Text } = Typography;

// --- VILOYATLAR VA TUMANLAR RO'YXATI (UZ) ---
const REGIONS_DATA = [
  { name: "Qoraqalpog'iston", districts: ["Nukus sh.", "Chimboy", "Qo'ng'irot", "Beruniy", "To'rtko'l", "Mo'ynoq", "Xo'jayli", "Shumanay", "Qanliko'l", "Kegeyli", "Qorao'zak", "Taxtako'pir", "Ellikqala", "Amudaryo", "Bo'zatov", "Nukus tumani"] },
  { name: "Toshkent shahri", districts: ["Yunusobod", "Chilonzor", "Mirzo Ulug'bek", "Yashnobod", "Yakkasaroy", "Sergeli", "Uchtepa", "Olmazor", "Bektemir", "Mirobod", "Shayxontohur", "Yangihayot"] },
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
const districtLabel = (district) => (district && district.trim() ? district : "Hammasi");
const formatMoney = (n) => Number(n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

const routeText = (o) => {
  const fromR = o.from_region || "-";
  const fromD = districtLabel(o.from_district);
  const toR = o.to_region || "-";
  const toD = districtLabel(o.to_district);
  return `${fromR} / ${fromD}  →  ${toR} / ${toD}`;
};

// Prefill from auth user metadata/phone/localStorage
const buildPrefill = (user) => {
  const lsName = localStorage.getItem("passenger_name") || "";
  const lsPhone = localStorage.getItem("passenger_phone") || "";

  const metaName = user?.user_metadata?.full_name || user?.user_metadata?.name || "";
  const authPhone = user?.phone || "";

  return {
    name: lsName || metaName || "",
    phone: lsPhone || authPhone || "",
  };
};

export default function ClientInterProvincial({ onBack }) {
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  const [results, setResults] = useState([]);
  const [errorText, setErrorText] = useState("");

  // booking request modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [reqSeats, setReqSeats] = useState(1);
  const [passengerName, setPassengerName] = useState("");
  const [passengerPhone, setPassengerPhone] = useState("");
  const [note, setNote] = useState("");

  // My requests & bookings
  const [myRequests, setMyRequests] = useState([]);
  const [myBookings, setMyBookings] = useState([]);

  // edit request modal
  const [editReqOpen, setEditReqOpen] = useState(false);
  const [editingReq, setEditingReq] = useState(null);

  const [form, setForm] = useState(() => {
    const saved = localStorage.getItem("clientInterProvSearch_v3");
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
    };
  });

  const fromDistricts = useMemo(() => {
    const list = getDistricts(form.fromRegion);
    if (isTashkentCity(form.fromRegion)) return ["", ...list];
    return list;
  }, [form.fromRegion]);

  const toDistricts = useMemo(() => {
    const list = getDistricts(form.toRegion);
    if (isTashkentCity(form.toRegion)) return ["", ...list];
    return list;
  }, [form.toRegion]);

  useEffect(() => {
    if (!fromDistricts.includes(form.fromDistrict)) {
      setForm((p) => ({ ...p, fromDistrict: fromDistricts[0] ?? "" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.fromRegion]);

  useEffect(() => {
    if (!toDistricts.includes(form.toDistrict)) {
      setForm((p) => ({ ...p, toDistrict: toDistricts[0] ?? "" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.toRegion]);

  useEffect(() => {
    localStorage.setItem("clientInterProvSearch_v3", JSON.stringify(form));
  }, [form]);

  const loadMyData = async () => {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    if (!user) return;

    const { data: reqs } = await supabase
      .from("trip_booking_requests")
      .select("*")
      .eq("passenger_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    const { data: bookings } = await supabase
      .from("trip_bookings")
      .select("*")
      .eq("passenger_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    setMyRequests(reqs || []);
    setMyBookings(bookings || []);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await doSearch(true);
      await loadMyData();

      // realtime for my requests/bookings
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (user) {
        const ch = supabase
          .channel("rt_passenger_interprov")
          .on("postgres_changes", { event: "*", schema: "public", table: "trip_booking_requests", filter: `passenger_id=eq.${user.id}` }, async () => {
            await loadMyData();
          })
          .on("postgres_changes", { event: "*", schema: "public", table: "trip_bookings", filter: `passenger_id=eq.${user.id}` }, async () => {
            await loadMyData();
          })
          .subscribe();

        return () => supabase.removeChannel(ch);
      }
      setLoading(false);
    };
    init();
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

      // Wildcard:
      // If passenger picked district => (order district == picked) OR (order district == '')
      // If passenger district empty AND region == Toshkent shahri => no district filter
      if (!isTashkentCity(form.fromRegion) || fromDistrictFilter) q = q.or(`from_district.eq.${fromDistrictFilter},from_district.eq.`);
      if (!isTashkentCity(form.toRegion) || toDistrictFilter) q = q.or(`to_district.eq.${toDistrictFilter},to_district.eq.`);

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

  const openRequestModal = async (order) => {
    setSelectedOrder(order);
    setReqSeats(1);
    setNote("");

    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;

    const pre = buildPrefill(user);
    setPassengerName(pre.name);
    setPassengerPhone(pre.phone);

    setModalOpen(true);
  };

  const sendRequest = async () => {
    try {
      if (!selectedOrder) return;

      const seatsReq = Number(reqSeats || 1);
      if (seatsReq < 1) return message.error("Joy kamida 1 bo‘lsin!");
      if (!passengerPhone.trim()) return message.error("Telefon raqamingizni kiriting!");

      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr) throw authErr;
      const user = authData?.user;
      if (!user) return message.error("So‘rov yuborish uchun avval tizimga kiring!");

      // save local
      localStorage.setItem("passenger_name", passengerName);
      localStorage.setItem("passenger_phone", passengerPhone);

      // RPC: request_inter_prov_booking
      const { error } = await supabase.rpc("request_inter_prov_booking", {
        p_order_id: selectedOrder.id,
        p_passenger_id: user.id,
        p_passenger_name: passengerName || "",
        p_passenger_phone: passengerPhone,
        p_seats: seatsReq,
        p_note: note || null,
      });
      if (error) throw error;

      message.success("So‘rov yuborildi! Haydovchi qabul qilsa sizga xabar keladi.");
      setModalOpen(false);
      setSelectedOrder(null);

      await loadMyData();
    } catch (e) {
      console.error(e);
      message.error(e?.message || "So‘rov yuborishda xatolik!");
    }
  };

  const openEditRequest = (req) => {
    setEditingReq(req);
    setReqSeats(req.seats);
    setPassengerName(req.passenger_name || passengerName);
    setPassengerPhone(req.passenger_phone || passengerPhone);
    setNote(req.note || "");
    setEditReqOpen(true);
  };

  const saveRequestEdits = async () => {
    try {
      if (!editingReq) return;
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) return message.error("Avval tizimga kiring!");

      const seatsReq = Number(reqSeats || 1);
      if (seatsReq < 1) return message.error("Joy kamida 1 bo‘lsin!");
      if (!passengerPhone.trim()) return message.error("Telefon raqamingizni kiriting!");

      localStorage.setItem("passenger_name", passengerName);
      localStorage.setItem("passenger_phone", passengerPhone);

      const { error } = await supabase.rpc("edit_booking_request", {
        p_request_id: editingReq.id,
        p_passenger_id: user.id,
        p_seats: seatsReq,
        p_passenger_name: passengerName || "",
        p_passenger_phone: passengerPhone,
        p_note: note || null,
      });
      if (error) throw error;

      message.success("So‘rov yangilandi!");
      setEditReqOpen(false);
      setEditingReq(null);
      await loadMyData();
    } catch (e) {
      console.error(e);
      message.error(e?.message || "Tahrirlashda xatolik!");
    }
  };

  const cancelRequest = async (req) => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) return message.error("Avval tizimga kiring!");

      const { error } = await supabase.rpc("cancel_booking_request", {
        p_request_id: req.id,
        p_passenger_id: user.id,
      });
      if (error) throw error;

      message.success("So‘rov bekor qilindi!");
      await loadMyData();
    } catch (e) {
      console.error(e);
      message.error(e?.message || "Bekor qilishda xatolik!");
    }
  };

  const cancelBooking = async (booking) => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) return message.error("Avval tizimga kiring!");

      const { error } = await supabase.rpc("cancel_booking", {
        p_booking_id: booking.id,
        p_passenger_id: user.id,
      });
      if (error) throw error;

      message.success("Bron bekor qilindi!");
      await loadMyData();
      await doSearch(true);
    } catch (e) {
      console.error(e);
      message.error(e?.message || "Bron bekor qilishda xatolik!");
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
        <Title level={4} style={{ margin: 0 }}>
          Viloyatlar/Tumanlar aro — Yo‘lovchi qidiruvi
        </Title>
        <Tag color="purple">inter_prov</Tag>
      </div>

      {/* My Requests/Bookings */}
      <Card style={{ borderRadius: 18, border: "none", boxShadow: "0 6px 20px rgba(0,0,0,0.06)", marginBottom: 12 }}>
        <Title level={5} style={{ marginTop: 0 }}>
          Mening so‘rovlarim va bronlarim
        </Title>

        <Divider orientation="left">So‘rovlar</Divider>
        {myRequests.length === 0 ? (
          <Text type="secondary">So‘rov yo‘q.</Text>
        ) : (
          <List
            dataSource={myRequests}
            renderItem={(r) => (
              <List.Item
                actions={[
                  r.status === "requested" ? (
                    <Button key="edit" icon={<EditOutlined />} onClick={() => openEditRequest(r)}>
                      Tahrirlash
                    </Button>
                  ) : null,
                  r.status === "requested" ? (
                    <Popconfirm key="del" title="So‘rovni bekor qilasizmi?" onConfirm={() => cancelRequest(r)}>
                      <Button danger icon={<DeleteOutlined />}>
                        Bekor qilish
                      </Button>
                    </Popconfirm>
                  ) : null,
                ]}
              >
                <List.Item.Meta
                  title={
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <Tag color={r.status === "requested" ? "blue" : r.status === "accepted" ? "green" : "default"}>{r.status}</Tag>
                      <span style={{ fontWeight: 600 }}>{r.seats} ta joy</span>
                    </div>
                  }
                  description={
                    <div>
                      <Text type="secondary">Order:</Text> {r.order_id}
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {dayjs(r.created_at).format("YYYY-MM-DD HH:mm")}
                      </Text>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}

        <Divider orientation="left">Bronlar (qabul qilingan)</Divider>
        {myBookings.length === 0 ? (
          <Text type="secondary">Bron yo‘q.</Text>
        ) : (
          <List
            dataSource={myBookings}
            renderItem={(b) => (
              <List.Item
                actions={[
                  b.status === "active" ? (
                    <Popconfirm key="c" title="Bronni bekor qilasizmi?" onConfirm={() => cancelBooking(b)}>
                      <Button danger>Bronni bekor qilish</Button>
                    </Popconfirm>
                  ) : null,
                ]}
              >
                <List.Item.Meta
                  title={
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <Tag color={b.status === "active" ? "green" : "default"}>{b.status}</Tag>
                      <span style={{ fontWeight: 600 }}>{b.seats} ta joy</span>
                    </div>
                  }
                  description={
                    <div>
                      <Text type="secondary">Haydovchi bilan bog‘lanish:</Text>{" "}
                      <b>{b.status === "active" ? (b.passenger_phone ? "✅ (Sizning telefoningiz haydovchiga ko‘rindi)" : "") : "-"}</b>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {dayjs(b.created_at).format("YYYY-MM-DD HH:mm")}
                      </Text>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>

      {/* Search Filters */}
      <Card style={{ borderRadius: 18, border: "none", boxShadow: "0 6px 20px rgba(0,0,0,0.06)" }}>
        <Title level={5} style={{ marginTop: 0 }}>
          Qidiruv filtrlari
        </Title>

        <Divider orientation="left">Qayerdan</Divider>
        <Row gutter={12}>
          <Col xs={24} md={12}>
            <Text type="secondary">Viloyat</Text>
            <Select value={form.fromRegion} onChange={(v) => setForm((p) => ({ ...p, fromRegion: v }))} style={{ width: "100%", marginTop: 6 }} size="large">
              {REGIONS_DATA.map((r) => (
                <Select.Option key={r.name} value={r.name}>
                  {r.name}
                </Select.Option>
              ))}
            </Select>
          </Col>

          <Col xs={24} md={12}>
            <Text type="secondary">Tuman/Shahar</Text>
            <Select value={form.fromDistrict} onChange={(v) => setForm((p) => ({ ...p, fromDistrict: v }))} style={{ width: "100%", marginTop: 6 }} size="large">
              {fromDistricts.map((d) => (
                <Select.Option key={`${d}`} value={d}>
                  {districtLabel(d)}
                </Select.Option>
              ))}
            </Select>
            {isTashkentCity(form.fromRegion) ? (
              <Text type="secondary" style={{ fontSize: 12 }}>
                * Toshkent shahri uchun tumanni tanlamasangiz ham bo‘ladi (Hammasi).
              </Text>
            ) : null}
          </Col>
        </Row>

        <Divider orientation="left">Qayerga</Divider>
        <Row gutter={12}>
          <Col xs={24} md={12}>
            <Text type="secondary">Viloyat</Text>
            <Select value={form.toRegion} onChange={(v) => setForm((p) => ({ ...p, toRegion: v }))} style={{ width: "100%", marginTop: 6 }} size="large">
              {REGIONS_DATA.map((r) => (
                <Select.Option key={r.name} value={r.name}>
                  {r.name}
                </Select.Option>
              ))}
            </Select>
          </Col>

          <Col xs={24} md={12}>
            <Text type="secondary">Tuman/Shahar</Text>
            <Select value={form.toDistrict} onChange={(v) => setForm((p) => ({ ...p, toDistrict: v }))} style={{ width: "100%", marginTop: 6 }} size="large">
              {toDistricts.map((d) => (
                <Select.Option key={`${d}`} value={d}>
                  {districtLabel(d)}
                </Select.Option>
              ))}
            </Select>
            {isTashkentCity(form.toRegion) ? (
              <Text type="secondary" style={{ fontSize: 12 }}>
                * Toshkent shahri uchun tumanni tanlamasangiz ham bo‘ladi (Hammasi).
              </Text>
            ) : null}
          </Col>
        </Row>

        <Divider />

        <Row gutter={12} align="middle">
          <Col xs={24} md={8}>
            <Text type="secondary">Sana (ixtiyoriy)</Text>
            <DatePicker value={form.date ? dayjs(form.date) : null} onChange={(d) => setForm((p) => ({ ...p, date: d ? d.format("YYYY-MM-DD") : "" }))} style={{ width: "100%", marginTop: 6 }} size="large" allowClear />
          </Col>

          <Col xs={24} md={8}>
            <Text type="secondary">Minimum joylar</Text>
            <InputNumber min={1} max={20} value={form.minSeats} onChange={(v) => setForm((p) => ({ ...p, minSeats: Number(v || 1) }))} style={{ width: "100%", marginTop: 6 }} size="large" />
          </Col>

          <Col xs={24} md={8}>
            <Button type="primary" size="large" block icon={<SearchOutlined />} loading={searching} onClick={() => doSearch(false)} style={{ borderRadius: 14, height: 48, marginTop: 24 }}>
              Qidirish
            </Button>
          </Col>
        </Row>
      </Card>

      <div style={{ height: 14 }} />

      {/* Results */}
      <Card style={{ borderRadius: 18, border: "none", boxShadow: "0 6px 20px rgba(0,0,0,0.06)" }}>
        <Title level={5} style={{ marginTop: 0 }}>
          Topilgan e’lonlar
        </Title>

        {errorText ? (
          <Result status="error" title="Xatolik" subTitle={errorText} />
        ) : results.length === 0 ? (
          <Result icon={<CarOutlined />} title="Hozircha mos e’lon topilmadi" subTitle="Filtrlarni o‘zgartirib ko‘ring yoki keyinroq qayta qidiring." />
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
                          <Text>
                            <CalendarOutlined /> <b>{sched ? sched.format("YYYY-MM-DD") : "-"}</b>
                          </Text>
                          <Text>
                            <ClockCircleOutlined /> <b>{sched ? sched.format("HH:mm") : "-"}</b>
                          </Text>
                          <Text>
                            <UserOutlined /> <b>{order.seats_available ?? "-"}</b> / {order.seats_total ?? "-"} joy
                          </Text>
                          <Text>
                            <b>{formatMoney(order.price)}</b> so‘m
                          </Text>
                        </Space>

                        <Text type="secondary" style={{ fontSize: 12 }}>
                          * “Band qilish” bosilganda haydovchiga so‘rov boradi. Haydovchi qabul qilgandan keyin sizga tasdiq keladi.
                        </Text>
                      </Space>
                    </Col>

                    <Col xs={24} md={8}>
                      <Button type="primary" block size="large" icon={<CheckCircleOutlined />} onClick={() => openRequestModal(order)} style={{ borderRadius: 14, height: 44 }}>
                        Band qilish (so‘rov yuborish)
                      </Button>
                    </Col>
                  </Row>
                </Card>
              );
            })}
          </Space>
        )}
      </Card>

      {/* Create request modal */}
      <Modal title="Band qilish (haydovchiga so‘rov yuboriladi)" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={sendRequest} okText="So‘rov yuborish">
        {!selectedOrder ? null : (
          <div>
            <Tag color="purple" style={{ marginBottom: 8 }}>
              {routeText(selectedOrder)}
            </Tag>

            <div style={{ marginBottom: 10 }}>
              <Text type="secondary">Qolgan joy:</Text> <b>{selectedOrder.seats_available ?? "-"}</b>
            </div>

            <Divider />

            <Text type="secondary">Ism Familiya (ro‘yxatdan o‘tganingizdan avtomat keladi, o‘zgartirsa bo‘ladi)</Text>
            <Input value={passengerName} onChange={(e) => setPassengerName(e.target.value)} placeholder="Masalan: Abdiev Timur" style={{ marginTop: 6, marginBottom: 12 }} />

            <Text type="secondary">Telefon raqam (avtomat keladi, o‘zgartirsa bo‘ladi)</Text>
            <Input value={passengerPhone} onChange={(e) => setPassengerPhone(e.target.value)} placeholder="+998 ..." style={{ marginTop: 6, marginBottom: 12 }} />

            <Text type="secondary">Nechta joy so‘raysiz?</Text>
            <InputNumber min={1} max={Number(selectedOrder.seats_available || 1)} value={reqSeats} onChange={(v) => setReqSeats(Number(v || 1))} style={{ width: "100%", marginTop: 6, marginBottom: 12 }} />

            <Text type="secondary">Izoh (ixtiyoriy)</Text>
            <Input.TextArea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Masalan: 2 ta joy, ertaroq bo‘lsa yaxshi..." style={{ marginTop: 6 }} />
          </div>
        )}
      </Modal>

      {/* Edit request modal */}
      <Modal title="So‘rovni tahrirlash" open={editReqOpen} onCancel={() => setEditReqOpen(false)} onOk={saveRequestEdits} okText="Saqlash">
        {!editingReq ? null : (
          <div>
            <Tag color="blue">{editingReq.status}</Tag>
            <Divider />
            <Text type="secondary">Ism Familiya</Text>
            <Input value={passengerName} onChange={(e) => setPassengerName(e.target.value)} style={{ marginTop: 6, marginBottom: 12 }} />
            <Text type="secondary">Telefon</Text>
            <Input value={passengerPhone} onChange={(e) => setPassengerPhone(e.target.value)} style={{ marginTop: 6, marginBottom: 12 }} />
            <Text type="secondary">Joylar</Text>
            <InputNumber min={1} value={reqSeats} onChange={(v) => setReqSeats(Number(v || 1))} style={{ width: "100%", marginTop: 6, marginBottom: 12 }} />
            <Text type="secondary">Izoh</Text>
            <Input.TextArea value={note} onChange={(e) => setNote(e.target.value)} rows={3} style={{ marginTop: 6 }} />
          </div>
        )}
      </Modal>
    </div>
  );
}