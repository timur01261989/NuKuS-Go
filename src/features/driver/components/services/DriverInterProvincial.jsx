import React, { useMemo, useState, useEffect } from "react";
import {
  Card, Button, Typography, Row, Col,
  TimePicker, DatePicker, InputNumber, Space,
  message, ConfigProvider, Divider, Select, Tag, Skeleton
} from "antd";
import {
  ArrowLeftOutlined, EnvironmentFilled, ClockCircleOutlined, CalendarOutlined,
  UserOutlined, DeleteOutlined, SendOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import { translations } from "@i18n/translations";
import { supabase } from "../../../../lib/supabase";

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


// STATUS:
// - pending   => e'lon ochiq
// - booked    => yo'lovchi band qildi (client_id to'ldiriladi)
// - cancelled => haydovchi bekor qildi
//
// service_type:
// - inter_prov => viloyat/tumanlar aro e'lon

export default function DriverInterProvincial({ onBack }) {
  const savedLang = localStorage.getItem("appLang") || "uz_lotin";
  const t = translations[savedLang] || translations["uz_lotin"];

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeAd, setActiveAd] = useState(null);

  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem("activeInterProvAdDraft");
    if (saved) {
      try {
        const p = JSON.parse(saved);
        return {
          fromRegion: p.fromRegion || "Qoraqalpog'iston",
          fromDistrict: p.fromDistrict || "Nukus sh.",
          toRegion: p.toRegion || "Toshkent shahri",
          toDistrict: p.toDistrict || "Yunusobod",
          date: p.date || dayjs().format("YYYY-MM-DD"),
          time: p.time || "09:00",
          seats: Number(p.seats || 4),
          price: Number(p.price || 150000),
        };
      } catch (e) {}
    }
    return {
      fromRegion: "Qoraqalpog'iston",
      fromDistrict: "Nukus sh.",
      toRegion: "Toshkent shahri",
      toDistrict: "Yunusobod",
      date: dayjs().format("YYYY-MM-DD"),
      time: "09:00",
      seats: 4,
      price: 150000,
    };
  });

  const fromDistricts = useMemo(() => getDistricts(formData.fromRegion), [formData.fromRegion]);
  const toDistricts = useMemo(() => getDistricts(formData.toRegion), [formData.toRegion]);

  useEffect(() => {
    if (!fromDistricts.includes(formData.fromDistrict)) {
      setFormData(prev => ({ ...prev, fromDistrict: fromDistricts[0] || "" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.fromRegion]);

  useEffect(() => {
    if (!toDistricts.includes(formData.toDistrict)) {
      setFormData(prev => ({ ...prev, toDistrict: toDistricts[0] || "" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.toRegion]);

  useEffect(() => {
    localStorage.setItem("activeInterProvAdDraft", JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const { data: authData, error: authErr } = await supabase.auth.getUser();
        if (authErr) throw authErr;
        const user = authData?.user;
        if (!user) {
          message.error("Iltimos, avval tizimga kiring!");
          return;
        }

        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .eq("driver_id", user.id)
          .eq("service_type", "inter_prov")
          .in("status", ["pending", "booked"])
          .order("created_at", { ascending: false })
          .limit(1);

        if (error) throw error;
        setActiveAd(data && data.length ? data[0] : null);
      } catch (e) {
        console.error(e);
      } finally {
        setTimeout(() => setLoading(false), 450);
      }
    };
    init();
  }, []);

  const validate = () => {
    if (!formData.fromRegion || !formData.fromDistrict || !formData.toRegion || !formData.toDistrict) {
      message.error("Viloyat va tumanlarni to'liq tanlang!");
      return false;
    }
    if (formData.fromRegion === formData.toRegion && formData.fromDistrict === formData.toDistrict) {
      message.error("Qayerdan va qayerga bir xil bo'lmasin!");
      return false;
    }
    if (!formData.date || !formData.time) {
      message.error("Sana va vaqtni tanlang!");
      return false;
    }
    if (!formData.seats || formData.seats < 1) {
      message.error("O'rindiqlar soni kamida 1 bo'lishi kerak!");
      return false;
    }
    if (!formData.price || formData.price < 1000) {
      message.error("Narxni to'g'ri kiriting!");
      return false;
    }
    return true;
  };

  const createAd = async () => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr) throw authErr;
      const user = authData?.user;
      if (!user) {
        message.error("Iltimos, avval tizimga kiring!");
        return;
      }

      const scheduledAt = `${formData.date} ${formData.time}`;

      // Minimal DB mosligi uchun:
      // client_name  => scheduledAt ("YYYY-MM-DD HH:mm")
      // client_phone => seats
      const payload = {
        driver_id: user.id,
        client_id: null,
        service_type: "inter_prov",
        status: "pending",
        pickup_location: `${formData.fromRegion}, ${formData.fromDistrict}`,
        dropoff_location: `${formData.toRegion}, ${formData.toDistrict}`,
        price: formData.price,
        client_name: scheduledAt,
        client_phone: String(formData.seats),
      };

      const { data, error } = await supabase.from("orders").insert(payload).select("*").single();
      if (error) throw error;

      setActiveAd(data);
      message.success("E'lon yaratildi! Yo'lovchilar endi qidiruvda ko'radi.");
    } catch (e) {
      console.error(e);
      message.error(e?.message || "Xatolik yuz berdi!");
    } finally {
      setSubmitting(false);
    }
  };

  const cancelAd = async () => {
    if (!activeAd) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: "cancelled" })
        .eq("id", activeAd.id);

      if (error) throw error;
      setActiveAd(null);
      message.success("E'lon bekor qilindi.");
    } catch (e) {
      console.error(e);
      message.error(e?.message || "Bekor qilishda xatolik!");
    } finally {
      setSubmitting(false);
    }
  };

  const prettyRoute = (pickup, dropoff) => {
    const a = (pickup || "").split(",").map(s => s.trim());
    const b = (dropoff || "").split(",").map(s => s.trim());
    return {
      fromR: a[0] || "-",
      fromD: a[1] || "-",
      toR: b[0] || "-",
      toD: b[1] || "-",
    };
  };

  const activeInfo = activeAd ? prettyRoute(activeAd.pickup_location, activeAd.dropoff_location) : null;

  if (loading) {
    return (
      <div style={{ padding: 16 }}>
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    );
  }

  return (
    <ConfigProvider theme={{ token: { colorPrimary: "#1890ff", borderRadius: 12 } }}>
      <div style={{ padding: 16, maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={onBack} shape="circle" />
          <Title level={4} style={{ margin: 0 }}>Tumanlar/Viloyatlar aro — Haydovchi e'loni</Title>
          <Tag color="purple">inter_prov</Tag>
        </div>

        {activeAd ? (
          <Card style={{ borderRadius: 18, border: "none", boxShadow: "0 6px 20px rgba(0,0,0,0.06)" }}>
            <Row gutter={12} align="middle">
              <Col xs={24} md={16}>
                <Space direction="vertical" size={6} style={{ width: "100%" }}>
                  <Text type="secondary">Sizning aktiv e'loningiz</Text>
                  <Title level={5} style={{ margin: 0 }}>
                    <EnvironmentFilled style={{ marginRight: 8, color: "#1890ff" }} />
                    {activeInfo.fromR} / {activeInfo.fromD}  →  {activeInfo.toR} / {activeInfo.toD}
                  </Title>

                  <Space size={16} wrap>
                    <Text><CalendarOutlined /> <b>Sana:</b> {(activeAd.client_name || "").split(" ")[0] || "-"}</Text>
                    <Text><ClockCircleOutlined /> <b>Vaqt:</b> {(activeAd.client_name || "").split(" ")[1] || "-"}</Text>
                    <Text><UserOutlined /> <b>Joylar:</b> {activeAd.client_phone || "-"}</Text>
                    <Text><b>Narx:</b> {activeAd.price} so'm</Text>
                  </Space>

                  <Tag color={activeAd.status === "pending" ? "green" : "gold"} style={{ padding: "4px 10px", borderRadius: 999, width: "fit-content" }}>
                    {activeAd.status === "pending" ? "Ochiq" : "Band qilingan"}
                  </Tag>

                  <Text type="secondary" style={{ fontSize: 12 }}>
                    * Yo'lovchi band qilsa status "booked" bo'ladi (client_id to'ldiriladi).
                  </Text>
                </Space>
              </Col>

              <Col xs={24} md={8}>
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Button danger type="primary" icon={<DeleteOutlined />} block size="large" onClick={cancelAd} loading={submitting}>
                    E'lonni bekor qilish
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>
        ) : (
          <Card style={{ borderRadius: 18, border: "none", boxShadow: "0 6px 20px rgba(0,0,0,0.06)" }}>
            <Title level={5} style={{ marginTop: 0 }}>Yangi e'lon yaratish</Title>

            <Divider orientation="left">Qayerdan</Divider>
            <Row gutter={12}>
              <Col xs={24} md={12}>
                <Text type="secondary">Viloyat</Text>
                <Select
                  value={formData.fromRegion}
                  onChange={(v) => setFormData(prev => ({ ...prev, fromRegion: v }))}
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
                  value={formData.fromDistrict}
                  onChange={(v) => setFormData(prev => ({ ...prev, fromDistrict: v }))}
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
                  value={formData.toRegion}
                  onChange={(v) => setFormData(prev => ({ ...prev, toRegion: v }))}
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
                  value={formData.toDistrict}
                  onChange={(v) => setFormData(prev => ({ ...prev, toDistrict: v }))}
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

            <Row gutter={12}>
              <Col xs={24} md={12}>
                <Text type="secondary">Sana</Text>
                <DatePicker
                  value={dayjs(formData.date)}
                  onChange={(d) => setFormData(prev => ({ ...prev, date: d ? d.format("YYYY-MM-DD") : "" }))}
                  style={{ width: "100%", marginTop: 6 }}
                  size="large"
                />
              </Col>
              <Col xs={24} md={12}>
                <Text type="secondary">Vaqt</Text>
                <TimePicker
                  value={dayjs(formData.time, "HH:mm")}
                  onChange={(tVal) => setFormData(prev => ({ ...prev, time: tVal ? tVal.format("HH:mm") : "" }))}
                  format="HH:mm"
                  style={{ width: "100%", marginTop: 6 }}
                  size="large"
                />
              </Col>
            </Row>

            <Divider />

            <Row gutter={12}>
              <Col xs={24} md={12}>
                <Text type="secondary">Bo'sh o'rindiqlar</Text>
                <InputNumber
                  min={1}
                  max={20}
                  value={formData.seats}
                  onChange={(v) => setFormData(prev => ({ ...prev, seats: Number(v || 1) }))}
                  style={{ width: "100%", marginTop: 6 }}
                  size="large"
                />
              </Col>
              <Col xs={24} md={12}>
                <Text type="secondary">Narx (so'm)</Text>
                <InputNumber
                  min={1000}
                  step={1000}
                  value={formData.price}
                  onChange={(v) => setFormData(prev => ({ ...prev, price: Number(v || 0) }))}
                  style={{ width: "100%", marginTop: 6 }}
                  size="large"
                />
              </Col>
            </Row>

            <Divider />

            <Button
              type="primary"
              size="large"
              block
              icon={<SendOutlined />}
              onClick={createAd}
              loading={submitting}
              style={{ borderRadius: 14, height: 48 }}
            >
              E'lonni yaratish
            </Button>

            <div style={{ marginTop: 10 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                * E'lon yaratilgandan so'ng, yo'lovchi "Viloyatlar aro" sahifasida aynan shu yo'nalish bo'yicha qidirsa,
                sizning e'loningiz chiqadi.
              </Text>
            </div>
          </Card>
        )}
      </div>
    </ConfigProvider>
  );
}
