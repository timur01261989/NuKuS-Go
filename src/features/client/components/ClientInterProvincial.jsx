import React, { useEffect, useMemo, useState } from "react";
import {
  Card, Button, Typography, Row, Col, Select, DatePicker, InputNumber, Space,
  message, Tag, Skeleton, Result, Divider
} from "antd";
import {
  ArrowLeftOutlined, SearchOutlined, EnvironmentFilled, CalendarOutlined,
  ClockCircleOutlined, UserOutlined, CarOutlined, CheckCircleOutlined
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
  { name: "Namangan", districts: ["Namangan sh.", "Chortoq", "Chust", "Kosonsoy", "Mingbuloq", "Norin", "Pop", "To'raqo'rg'on", "Uchqo'rg'on", "Uychi", "Yangiqo'rg'on"] }
];

const getDistricts = (regionName) => {
  const region = REGIONS_DATA.find(r => r.name === regionName);
  return region ? region.districts : [];
};


// Yo'lovchi sahifasi: haydovchi e'lonlarini qidirish (inter_prov).
// DB logika:
// - orders.service_type = 'inter_prov'
// - orders.status = 'pending'
// - orders.client_id IS NULL
// - orders.pickup_location / dropoff_location => "Viloyat, Tuman"
// - orders.client_name => "YYYY-MM-DD HH:mm" (haydovchi belgilagan vaqt)
// - orders.client_phone => "4" (joylar soni)

const parseRoute = (value) => {
  const parts = (value || "").split(",").map(s => s.trim());
  return { region: parts[0] || "", district: parts[1] || "" };
};

const parseScheduled = (value) => {
  const s = (value || "").trim();
  const [d, t] = s.split(" ");
  return { date: d || "", time: t || "" };
};

export default function ClientInterProvincial({ onBack }) {
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  const [form, setForm] = useState(() => {
    const saved = localStorage.getItem("clientInterProvSearch");
    if (saved) {
      try {
        const p = JSON.parse(saved);
        return {
          fromRegion: p.fromRegion || "Qoraqalpog'iston",
          fromDistrict: p.fromDistrict || "Nukus sh.",
          toRegion: p.toRegion || "Toshkent shahri",
          toDistrict: p.toDistrict || "Yunusobod",
          date: p.date || "",
          minSeats: Number(p.minSeats || 1)
        };
      } catch (e) {}
    }
    return {
      fromRegion: "Qoraqalpog'iston",
      fromDistrict: "Nukus sh.",
      toRegion: "Toshkent shahri",
      toDistrict: "Yunusobod",
      date: "",
      minSeats: 1
    };
  });

  const fromDistricts = useMemo(() => getDistricts(form.fromRegion), [form.fromRegion]);
  const toDistricts = useMemo(() => getDistricts(form.toRegion), [form.toRegion]);

  const [results, setResults] = useState([]);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    if (!fromDistricts.includes(form.fromDistrict)) {
      setForm(prev => ({ ...prev, fromDistrict: fromDistricts[0] || "" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.fromRegion]);

  useEffect(() => {
    if (!toDistricts.includes(form.toDistrict)) {
      setForm(prev => ({ ...prev, toDistrict: toDistricts[0] || "" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.toRegion]);

  useEffect(() => {
    localStorage.setItem("clientInterProvSearch", JSON.stringify(form));
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
      const pickup = `${form.fromRegion}, ${form.fromDistrict}`;
      const dropoff = `${form.toRegion}, ${form.toDistrict}`;

      let query = supabase
        .from("orders")
        .select("*")
        .eq("service_type", "inter_prov")
        .eq("status", "pending")
        .is("client_id", null)
        .eq("pickup_location", pickup)
        .eq("dropoff_location", dropoff)
        .order("created_at", { ascending: false });

      if (form.date) {
        query = query.ilike("client_name", `${form.date}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      const filtered = (data || []).filter(o => {
        const seats = Number(o.client_phone || 0);
        return seats >= (Number(form.minSeats || 1));
      });

      setResults(filtered);
      if (!silent) message.success(`Topildi: ${filtered.length} ta e'lon`);
    } catch (e) {
      console.error(e);
      setResults([]);
      setErrorText(e?.message || "Qidiruvda xatolik!");
      if (!silent) message.error(e?.message || "Qidiruvda xatolik!");
    } finally {
      setSearching(false);
    }
  };

  const bookTrip = async (orderId) => {
    try {
      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr) throw authErr;
      const user = authData?.user;
      if (!user) {
        message.error("Band qilish uchun avval tizimga kiring!");
        return;
      }

      const { data, error } = await supabase
        .from("orders")
        .update({ client_id: user.id, status: "booked" })
        .eq("id", orderId)
        .eq("status", "pending")
        .is("client_id", null)
        .select("*");

      if (error) throw error;
      if (!data || !data.length) {
        message.warning("Bu e'lonni boshqa yo'lovchi band qilgan bo'lishi mumkin.");
        await doSearch(true);
        return;
      }

      message.success("Band qilindi!");
      await doSearch(true);
    } catch (e) {
      console.error(e);
      message.error(e?.message || "Band qilishda xatolik!");
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 16 }}>
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    );
  }

  return (
    <div style={{ padding: 16, maxWidth: 980, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={onBack} shape="circle" />
        <Title level={4} style={{ margin: 0 }}>Viloyatlar/Tumanlar aro — Yo'lovchi qidiruvi</Title>
        <Tag color="purple">inter_prov</Tag>
      </div>

      <Card style={{ borderRadius: 18, border: "none", boxShadow: "0 6px 20px rgba(0,0,0,0.06)" }}>
        <Title level={5} style={{ marginTop: 0 }}>Qidiruv filtrlari</Title>

        <Divider orientation="left">Qayerdan</Divider>
        <Row gutter={12}>
          <Col xs={24} md={12}>
            <Text type="secondary">Viloyat</Text>
            <Select
              value={form.fromRegion}
              onChange={(v) => setForm(prev => ({ ...prev, fromRegion: v }))}
              style={{ width: "100%", marginTop: 6 }}
              size="large"
            >
              {REGIONS_DATA.map(r => (
                <Select.Option key={r.name} value={r.name}>{r.name}</Select.Option>
              ))}
            </Select>
          </Col>

          <Col xs={24} md={12}>
            <Text type="secondary">Tuman/Shahar</Text>
            <Select
              value={form.fromDistrict}
              onChange={(v) => setForm(prev => ({ ...prev, fromDistrict: v }))}
              style={{ width: "100%", marginTop: 6 }}
              size="large"
            >
              {fromDistricts.map(d => (
                <Select.Option key={d} value={d}>{d}</Select.Option>
              ))}
            </Select>
          </Col>
        </Row>

        <Divider orientation="left">Qayerga</Divider>
        <Row gutter={12}>
          <Col xs={24} md={12}>
            <Text type="secondary">Viloyat</Text>
            <Select
              value={form.toRegion}
              onChange={(v) => setForm(prev => ({ ...prev, toRegion: v }))}
              style={{ width: "100%", marginTop: 6 }}
              size="large"
            >
              {REGIONS_DATA.map(r => (
                <Select.Option key={r.name} value={r.name}>{r.name}</Select.Option>
              ))}
            </Select>
          </Col>

          <Col xs={24} md={12}>
            <Text type="secondary">Tuman/Shahar</Text>
            <Select
              value={form.toDistrict}
              onChange={(v) => setForm(prev => ({ ...prev, toDistrict: v }))}
              style={{ width: "100%", marginTop: 6 }}
              size="large"
            >
              {toDistricts.map(d => (
                <Select.Option key={d} value={d}>{d}</Select.Option>
              ))}
            </Select>
          </Col>
        </Row>

        <Divider />

        <Row gutter={12} align="middle">
          <Col xs={24} md={8}>
            <Text type="secondary">Sana (ixtiyoriy)</Text>
            <DatePicker
              value={form.date ? dayjs(form.date) : null}
              onChange={(d) => setForm(prev => ({ ...prev, date: d ? d.format("YYYY-MM-DD") : "" }))}
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
              onChange={(v) => setForm(prev => ({ ...prev, minSeats: Number(v || 1) }))}
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
        <Title level={5} style={{ marginTop: 0 }}>Topilgan e'lonlar</Title>

        {errorText ? (
          <Result status="error" title="Xatolik" subTitle={errorText} />
        ) : results.length === 0 ? (
          <Result
            icon={<CarOutlined />}
            title="Hozircha mos e'lon topilmadi"
            subTitle="Filtrlarni o'zgartirib ko'ring yoki keyinroq qayta qidiring."
          />
        ) : (
          <Space direction="vertical" style={{ width: "100%" }} size={12}>
            {results.map(order => {
              const from = parseRoute(order.pickup_location);
              const to = parseRoute(order.dropoff_location);
              const sched = parseScheduled(order.client_name);
              const seats = Number(order.client_phone || 0);

              return (
                <Card key={order.id} style={{ borderRadius: 16, border: "1px solid #f0f0f0" }}>
                  <Row gutter={12} align="middle">
                    <Col xs={24} md={16}>
                      <Space direction="vertical" size={4}>
                        <Title level={5} style={{ margin: 0 }}>
                          <EnvironmentFilled style={{ color: "#1890ff", marginRight: 8 }} />
                          {from.region} / {from.district}  →  {to.region} / {to.district}
                        </Title>

                        <Space size={16} wrap>
                          <Text><CalendarOutlined /> <b>{sched.date || "-"}</b></Text>
                          <Text><ClockCircleOutlined /> <b>{sched.time || "-"}</b></Text>
                          <Text><UserOutlined /> <b>{seats}</b> joy</Text>
                          <Text><b>{order.price}</b> so'm</Text>
                        </Space>

                        <Text type="secondary" style={{ fontSize: 12 }}>
                          E'lon ID: {order.id} • Haydovchi ID: {order.driver_id}
                        </Text>
                      </Space>
                    </Col>

                    <Col xs={24} md={8}>
                      <Button
                        type="primary"
                        block
                        size="large"
                        icon={<CheckCircleOutlined />}
                        onClick={() => bookTrip(order.id)}
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
    </div>
  );
}
