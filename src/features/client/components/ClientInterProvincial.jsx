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

export default function ClientInterProvincial({ onBack }) {
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  const [results, setResults] = useState([]);
  const [errorText, setErrorText] = useState("");

  // booking modal
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [bookingSeats, setBookingSeats] = useState(1);
  const [passengerName, setPassengerName] = useState("");
  const [passengerPhone, setPassengerPhone] = useState("");

  const [form, setForm] = useState(() => {
    const saved = localStorage.getItem("clientInterProvSearch_v2");
    if (saved) {
      try {
        const p = JSON.parse(saved);
        return {
          fromRegion: p.fromRegion || "Qoraqalpog'iston",
          fromDistrict: p.fromDistrict ?? "Nukus sh.",
          toRegion: p.toRegion || "Toshkent shahri",
          toDistrict: p.toDistrict ?? "", // yo‘lovchi ham Toshkent shahri bo‘lsa tumanni tanlamasa bo‘ladi
          date: p.date || "", // ixtiyoriy
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
    localStorage.setItem("clientInterProvSearch_v2", JSON.stringify(form));
  }, [form]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await doSearch(true);
      setLoading(false);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doSearch = async (silent = false) => {
    setSearching(true);
    setErrorText("");

    try {
      // Wildcard logika:
      // - Driver Toshkent shahri va district "" bo‘lsa: yo‘lovchi Toshkent shahri ichidagi istalgan district bilan qidirsa ham mos keladi.
      // - Yo‘lovchi Toshkent shahri va district "" bo‘lsa: hammasiga mos bo‘ladi (district shartini qo‘ymaymiz).
      const fromDistrictFilter = (form.fromDistrict || "").trim();
      const toDistrictFilter = (form.toDistrict || "").trim();

      let q = supabase
        .from("orders")
        .select("*")
        .eq("service_type", "inter_prov")
        .in("status", ["pending", "booked"]) // booked ham bo‘lishi mumkin, seats_available > 0 bo‘lsa ko‘rsatamiz
        .gt("seats_available", 0)
        .eq("from_region", form.fromRegion)
        .eq("to_region", form.toRegion)
        .order("scheduled_at", { ascending: true });

      // district shartlari:
      // Agar yo‘lovchi district tanlagan bo‘lsa:
      //  - order.from_district = tanlangan district OR order.from_district = '' (wildcard)
      if (!isTashkentCity(form.fromRegion) || fromDistrictFilter) {
        q = q.or(`from_district.eq.${fromDistrictFilter},from_district.eq.`); // '' ham mos
      } else {
        // yo‘lovchi ham Toshkent shahri va district bo‘sh: hech qanday district shart qo‘ymaymiz
      }

      if (!isTashkentCity(form.toRegion) || toDistrictFilter) {
        q = q.or(`to_district.eq.${toDistrictFilter},to_district.eq.`);
      } else {
        // Toshkent shahri va bo‘sh: shart yo‘q
      }

      // Sana ixtiyoriy
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

    // passenger info (localStorage)
    const savedName = localStorage.getItem("passenger_name") || "";
    const savedPhone = localStorage.getItem("passenger_phone") || "";
    setPassengerName(savedName);
    setPassengerPhone(savedPhone);

    setBookingModalOpen(true);
  };

  const confirmBooking = async () => {
    try {
      if (!selectedOrder) return;

      const seatsReq = Number(bookingSeats || 1);
      if (seatsReq < 1) {
        message.error("Joylar soni kamida 1 bo‘lsin!");
        return;
      }

      if (!passengerPhone.trim()) {
        message.error("Telefon raqamingizni kiriting!");
        return;
      }

      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr) throw authErr;
      const user = authData?.user;
      if (!user) {
        message.error("Band qilish uchun avval tizimga kiring!");
        return;
      }

      // passenger info saqlab qo‘yamiz
      localStorage.setItem("passenger_name", passengerName);
      localStorage.setItem("passenger_phone", passengerPhone);

      // ATOMIK bron:
      // RPC: book_inter_prov(order_id, passenger_id, name, phone, seats)
      const { data, error } = await supabase.rpc("book_inter_prov", {
        p_order_id: selectedOrder.id,
        p_passenger_id: user.id,
        p_passenger_name: passengerName || "",
        p_passenger_phone: passengerPhone,
        p_seats: seatsReq,
      });

      if (error) throw error;

      message.success("Band qilindi! Haydovchiga bildirishnoma yuborildi.");
      setBookingModalOpen(false);
      setSelectedOrder(null);

      await doSearch(true);
    } catch (e) {
      console.error(e);
      message.error(e?.message || "Band qilishda xatolik!");
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

      <Card style={{ borderRadius: 18, border: "none", boxShadow: "0 6px 20px rgba(0,0,0,0.06)" }}>
        <Title level={5} style={{ marginTop: 0 }}>
          Qidiruv filtrlari
        </Title>

        <Divider orientation="left">Qayerdan</Divider>
        <Row gutter={12}>
          <Col xs={24} md={12}>
            <Text type="secondary">Viloyat</Text>
            <Select
              value={form.fromRegion}
              onChange={(v) => setForm((p) => ({ ...p, fromRegion: v }))}
              style={{ width: "100%", marginTop: 6 }}
              size="large"
            >
              {REGIONS_DATA.map((r) => (
                <Select.Option key={r.name} value={r.name}>
                  {r.name}
                </Select.Option>
              ))}
            </Select>
          </Col>

          <Col xs={24} md={12}>
            <Text type="secondary">Tuman/Shahar</Text>
            <Select
              value={form.fromDistrict}
              onChange={(v) => setForm((p) => ({ ...p, fromDistrict: v }))}
              style={{ width: "100%", marginTop: 6 }}
              size="large"
            >
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
            <Select
              value={form.toRegion}
              onChange={(v) => setForm((p) => ({ ...p, toRegion: v }))}
              style={{ width: "100%", marginTop: 6 }}
              size="large"
            >
              {REGIONS_DATA.map((r) => (
                <Select.Option key={r.name} value={r.name}>
                  {r.name}
                </Select.Option>
              ))}
            </Select>
          </Col>

          <Col xs={24} md={12}>
            <Text type="secondary">Tuman/Shahar</Text>
            <Select
              value={form.toDistrict}
              onChange={(v) => setForm((p) => ({ ...p, toDistrict: v }))}
              style={{ width: "100%", marginTop: 6 }}
              size="large"
            >
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
            <DatePicker
              value={form.date ? dayjs(form.date) : null}
              onChange={(d) => setForm((p) => ({ ...p, date: d ? d.format("YYYY-MM-DD") : "" }))}
              style={{ width: "100%", marginTop: 6 }}
              size="large"
              allowClear
            />
          </Col>

          <Col xs={24} md={8}>
            <Text type="secondary">Minimum joylar</Text>
            <InputNumber
              min={1}
              max={20}
              value={form.minSeats}
              onChange={(v) => setForm((p) => ({ ...p, minSeats: Number(v || 1) }))}
              style={{ width: "100%", marginTop: 6 }}
              size="large"
            />
          </Col>

          <Col xs={24} md={8}>
            <Button
              type="primary"
              size="large"
              block
              icon={<SearchOutlined />}
              loading={searching}
              onClick={() => doSearch(false)}
              style={{ borderRadius: 14, height: 48, marginTop: 24 }}
            >
              Qidirish
            </Button>
          </Col>
        </Row>
      </Card>

      <div style={{ height: 14 }} />

      <Card style={{ borderRadius: 18, border: "none", boxShadow: "0 6px 20px rgba(0,0,0,0.06)" }}>
        <Title level={5} style={{ marginTop: 0 }}>
          Topilgan e’lonlar
        </Title>

        {errorText ? (
          <Result status="error" title="Xatolik" subTitle={errorText} />
        ) : results.length === 0 ? (
          <Result
            icon={<CarOutlined />}
            title="Hozircha mos e’lon topilmadi"
            subTitle="Filtrlarni o‘zgartirib ko‘ring yoki keyinroq qayta qidiring."
          />
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
                          Haydovchi ID: {order.driver_id}
                        </Text>
                      </Space>
                    </Col>

                    <Col xs={24} md={8}>
                      <Button
                        type="primary"
                        block
                        size="large"
                        icon={<CheckCircleOutlined />}
                        onClick={() => openBooking(order)}
                        style={{ borderRadius: 14, height: 44 }}
                      >
                        Band qilish
                      </Button>
                    </Col>
                  </Row>
                </Card>
              );
            })}
          </Space>
        )}
      </Card>

      {/* Booking modal */}
      <Modal
        title="Band qilish"
        open={bookingModalOpen}
        onCancel={() => setBookingModalOpen(false)}
        onOk={confirmBooking}
        okText="Band qilish"
      >
        {!selectedOrder ? null : (
          <div>
            <Tag color="purple" style={{ marginBottom: 8 }}>
              {routeText(selectedOrder)}
            </Tag>

            <div style={{ marginBottom: 10 }}>
              <Text type="secondary">Qolgan joy:</Text>{" "}
              <b>{selectedOrder.seats_available ?? "-"}</b>
            </div>

            <Divider />

            <Text type="secondary">Ismingiz (ixtiyoriy)</Text>
            <Input
              value={passengerName}
              onChange={(e) => setPassengerName(e.target.value)}
              placeholder="Masalan: Abdiev Timur"
              style={{ marginTop: 6, marginBottom: 12 }}
            />

            <Text type="secondary">Telefon raqamingiz</Text>
            <Input
              value={passengerPhone}
              onChange={(e) => setPassengerPhone(e.target.value)}
              placeholder="+998 ..."
              style={{ marginTop: 6, marginBottom: 12 }}
            />

            <Text type="secondary">Nechta joy band qilasiz?</Text>
            <InputNumber
              min={1}
              max={Number(selectedOrder.seats_available || 1)}
              value={bookingSeats}
              onChange={(v) => setBookingSeats(Number(v || 1))}
              style={{ width: "100%", marginTop: 6 }}
            />

            <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 10 }}>
              * “Band qilish” bosilganda haydovchiga bildirishnoma boradi va joylar avtomatik kamayadi.
            </Text>
          </div>
        )}
      </Modal>
    </div>
  );
}