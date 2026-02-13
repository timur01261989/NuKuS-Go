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
  { name: "Namangan", districts: ["Namangan sh.", "Chortoq", "Chust", "Kosonsoy", "Mingbuloq", "Norin", "Pop", "To'raqo'rg'on", "Uchqo'rg'on", "Uychi", "Yangiqo'rg'on"] },
];

const getDistricts = (regionName) => {
  const region = REGIONS_DATA.find((r) => r.name === regionName);
  return region ? region.districts : [];
};

const isTashkentCity = (regionName) => regionName === "Toshkent shahri";

// district bo‘sh bo‘lsa “Hammasi” deb ko‘rsatamiz
const districtLabel = (district) => (district && district.trim() ? district : "Hammasi");

const formatMoney = (n) => {
  const v = Number(n || 0);
  return v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

// orderdan route info
const routeText = (o) => {
  const fromR = o.from_region || "-";
  const fromD = districtLabel(o.from_district);
  const toR = o.to_region || "-";
  const toD = districtLabel(o.to_district);
  return `${fromR} / ${fromD}  →  ${toR} / ${toD}`;
};

export default function DriverInterProvincial({ onBack }) {
  const savedLang = localStorage.getItem("appLang") || "uz_lotin";
  const t = translations[savedLang] || translations["uz_lotin"];

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [activeAd, setActiveAd] = useState(null); // driverning aktiv e’loni
  const [bookings, setBookings] = useState([]); // yo‘lovchilar bronlari
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const [editMode, setEditMode] = useState(false);

  // --- Driver profil ma’lumotlari (yo‘lovchi band qilganda saqlash uchun kerak) ---
  // (Sizda drivers table borligi ko‘rindi. Undan phone va name olib qo‘yamiz)
  const [driverProfile, setDriverProfile] = useState({ name: "", phone: "" });

  // --- Forma ---
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem("driverInterProvDraft_v2");
    if (saved) {
      try {
        const p = JSON.parse(saved);
        return {
          fromRegion: p.fromRegion || "Qoraqalpog'iston",
          fromDistrict: p.fromDistrict ?? "Nukus sh.",
          toRegion: p.toRegion || "Toshkent shahri",
          toDistrict: p.toDistrict ?? "", // Toshkent shahri uchun tuman bo‘sh bo‘lishi mumkin
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
      toDistrict: "", // Toshkent shahri uchun tuman tanlanmasa ham bo‘ladi
      date: dayjs().format("YYYY-MM-DD"),
      time: "09:00",
      seatsTotal: 4,
      price: 150000,
    };
  });

  const fromDistricts = useMemo(() => {
    const list = getDistricts(formData.fromRegion);
    // Toshkent shahri bo‘lsa — “Hammasi (bo‘sh)” variantini qo‘shamiz
    if (isTashkentCity(formData.fromRegion)) return ["", ...list];
    return list;
  }, [formData.fromRegion]);

  const toDistricts = useMemo(() => {
    const list = getDistricts(formData.toRegion);
    if (isTashkentCity(formData.toRegion)) return ["", ...list];
    return list;
  }, [formData.toRegion]);

  useEffect(() => {
    // default district mos kelmasa — birinchisiga tushiramiz
    if (!fromDistricts.includes(formData.fromDistrict)) {
      setFormData((prev) => ({ ...prev, fromDistrict: fromDistricts[0] ?? "" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.fromRegion]);

  useEffect(() => {
    if (!toDistricts.includes(formData.toDistrict)) {
      setFormData((prev) => ({ ...prev, toDistrict: toDistricts[0] ?? "" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.toRegion]);

  useEffect(() => {
    localStorage.setItem("driverInterProvDraft_v2", JSON.stringify(formData));
  }, [formData]);

  const loadActiveAd = async (userId) => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("driver_id", userId)
      .eq("service_type", "inter_prov")
      .in("status", ["pending", "booked"])
      .order("created_at", { ascending: false })
      .limit(1);
    if (error) throw error;
    return data?.[0] || null;
  };

  const loadBookings = async (orderId) => {
    const { data, error } = await supabase
      .from("trip_bookings")
      .select("*")
      .eq("order_id", orderId)
      .eq("status", "active")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
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

  const markNotifRead = async (notifIds) => {
    if (!notifIds?.length) return;
    await supabase.from("notifications").update({ is_read: true }).in("id", notifIds);
  };

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

        // driver profile (agar sizda drivers table bo‘lsa)
        try {
          const { data: d, error: derr } = await supabase
            .from("drivers")
            .select("name, phone")
            .eq("id", user.id)
            .maybeSingle();
          if (!derr && d) setDriverProfile({ name: d.name || "", phone: d.phone || "" });
        } catch (e) {}

        const ad = await loadActiveAd(user.id);
        setActiveAd(ad);

        const notifs = await loadNotifications(user.id);
        setNotifications(notifs);

        if (ad?.id) {
          const b = await loadBookings(ad.id);
          setBookings(b);
        }

        // Realtime: bookings + notifications
        const bookingChannel = supabase
          .channel("realtime_trip_bookings_driver")
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "trip_bookings" },
            async (payload) => {
              // faqat activeAd bo‘lsa refresh
              if (!activeAd?.id) return;
              // refresh bookings + activeAd seats
              try {
                const freshAd = await loadActiveAd(user.id);
                setActiveAd(freshAd);
                if (freshAd?.id) {
                  const b = await loadBookings(freshAd.id);
                  setBookings(b);
                }
              } catch (e) {}
            }
          )
          .subscribe();

        const notifChannel = supabase
          .channel("realtime_notifications_driver")
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
            async () => {
              try {
                const notifs2 = await loadNotifications(user.id);
                setNotifications(notifs2);
              } catch (e) {}
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(bookingChannel);
          supabase.removeChannel(notifChannel);
        };
      } catch (e) {
        console.error(e);
        message.error(e?.message || "Xatolik!");
      } finally {
        setTimeout(() => setLoading(false), 350);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validate = () => {
    if (!formData.fromRegion || formData.fromRegion.trim() === "") {
      message.error("Qayerdan viloyatini tanlang!");
      return false;
    }

    // Toshkent shahri bo‘lmasa tuman majburiy
    if (!isTashkentCity(formData.fromRegion) && (!formData.fromDistrict || !formData.fromDistrict.trim())) {
      message.error("Qayerdan tumanini tanlang!");
      return false;
    }

    if (!formData.toRegion || formData.toRegion.trim() === "") {
      message.error("Qayerga viloyatini tanlang!");
      return false;
    }
    if (!isTashkentCity(formData.toRegion) && (!formData.toDistrict || !formData.toDistrict.trim())) {
      message.error("Qayerga tumanini tanlang!");
      return false;
    }

    // bir xil bo‘lmasin (hammasi/bo‘sh variantlarda ham tekshiramiz)
    if (
      formData.fromRegion === formData.toRegion &&
      (formData.fromDistrict || "") === (formData.toDistrict || "")
    ) {
      message.error("Qayerdan va qayerga bir xil bo‘lmasin!");
      return false;
    }

    if (!formData.date || !formData.time) {
      message.error("Sana va vaqtni tanlang!");
      return false;
    }

    if (!formData.seatsTotal || formData.seatsTotal < 1) {
      message.error("O‘rindiqlar soni kamida 1 bo‘lishi kerak!");
      return false;
    }

    if (!formData.price || formData.price < 1000) {
      message.error("Narxni to‘g‘ri kiriting!");
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

      const scheduledAt = dayjs(`${formData.date} ${formData.time}`, "YYYY-MM-DD HH:mm").toISOString();

      const payload = {
        driver_id: user.id,
        client_id: null,
        service_type: "inter_prov",
        status: "pending",

        // Structured route (search uchun)
        from_region: formData.fromRegion,
        from_district: (formData.fromDistrict || "").trim(), // Toshkent shahri bo‘lsa "" bo‘lishi mumkin
        to_region: formData.toRegion,
        to_district: (formData.toDistrict || "").trim(),

        scheduled_at: scheduledAt,
        seats_total: formData.seatsTotal,
        seats_available: formData.seatsTotal,

        // display uchun (eski UIlar)
        pickup_location: `${formData.fromRegion}, ${districtLabel(formData.fromDistrict)}`,
        dropoff_location: `${formData.toRegion}, ${districtLabel(formData.toDistrict)}`,
        price: formData.price,
      };

      const { data, error } = await supabase.from("orders").insert(payload).select("*").single();
      if (error) throw error;

      setActiveAd(data);
      setBookings([]);
      setEditMode(false);
      message.success("E’lon yaratildi! Yo‘lovchilar qidiruvda ko‘radi.");
    } catch (e) {
      console.error(e);
      message.error(e?.message || "Xatolik yuz berdi!");
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

      // Eslatma:
      // seats_total ni o‘zgartirsak, seats_available ham o‘zgaradi, lekin bronlar bo‘lsa ehtiyot bo‘lish kerak.
      // Shuning uchun: seats_total ni faqat aktiv bron yo‘q bo‘lsa o‘zgartiramiz.
      const hasBookings = bookings.length > 0;
      const seatsPatch = hasBookings
        ? {}
        : { seats_total: formData.seatsTotal, seats_available: formData.seatsTotal };

      const patch = {
        from_region: formData.fromRegion,
        from_district: (formData.fromDistrict || "").trim(),
        to_region: formData.toRegion,
        to_district: (formData.toDistrict || "").trim(),
        scheduled_at: scheduledAt,
        price: formData.price,
        pickup_location: `${formData.fromRegion}, ${districtLabel(formData.fromDistrict)}`,
        dropoff_location: `${formData.toRegion}, ${districtLabel(formData.toDistrict)}`,
        ...seatsPatch,
      };

      const { data, error } = await supabase.from("orders").update(patch).eq("id", activeAd.id).select("*").single();
      if (error) throw error;

      setActiveAd(data);
      setEditMode(false);

      // Notification (o‘zingizga yoki yo‘lovchiga ham yuborish mumkin)
      try {
        await supabase.from("notifications").insert({
          user_id: data.driver_id,
          type: "order_updated",
          title: "E’lon yangilandi",
          body: `Yo‘nalish/vaqt/narx yangilandi: ${routeText(data)}`,
          order_id: data.id,
        });
      } catch (e) {}

      message.success("E’lon yangilandi!");
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
      setBookings([]);
      setEditMode(false);
      message.success("E’lon bekor qilindi.");
    } catch (e) {
      console.error(e);
      message.error(e?.message || "Bekor qilishda xatolik!");
    } finally {
      setSubmitting(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

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

  const fillFormFromActive = (o) => {
    if (!o) return;
    const sched = o.scheduled_at ? dayjs(o.scheduled_at) : null;

    setFormData({
      fromRegion: o.from_region || formData.fromRegion,
      fromDistrict: o.from_district ?? "",
      toRegion: o.to_region || formData.toRegion,
      toDistrict: o.to_district ?? "",
      date: sched ? sched.format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"),
      time: sched ? sched.format("HH:mm") : "09:00",
      seatsTotal: Number(o.seats_total || 4),
      price: Number(o.price || 0),
    });
  };

  useEffect(() => {
    if (activeAd) fillFormFromActive(activeAd);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeAd?.id]);

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
              <Title level={4} style={{ margin: 0 }}>
                Tumanlar/Viloyatlar aro — Haydovchi e’loni
              </Title>
              <Text type="secondary">service_type: <b>inter_prov</b></Text>
            </div>
          </div>

          <div>
            <Badge count={unreadCount} overflowCount={99}>
              <Button icon={<BellOutlined />} onClick={openNotifications}>
                Bildirishnomalar
              </Button>
            </Badge>
          </div>
        </div>

        {/* Notifications modal */}
        <Modal
          title="Bildirishnomalar"
          open={notifOpen}
          onCancel={() => setNotifOpen(false)}
          footer={null}
        >
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

        {/* Active Ad card */}
        {activeAd ? (
          <Card style={{ borderRadius: 18, border: "none", boxShadow: "0 6px 20px rgba(0,0,0,0.06)" }}>
            <Row gutter={12} align="middle">
              <Col xs={24} md={16}>
                <Space direction="vertical" size={6} style={{ width: "100%" }}>
                  <Text type="secondary">Sizning aktiv e’loningiz</Text>
                  <Title level={5} style={{ margin: 0 }}>
                    <EnvironmentFilled style={{ marginRight: 8, color: "#1890ff" }} />
                    {routeText(activeAd)}
                  </Title>

                  <Space size={16} wrap>
                    <Text>
                      <CalendarOutlined /> <b>Sana:</b>{" "}
                      {activeAd.scheduled_at ? dayjs(activeAd.scheduled_at).format("YYYY-MM-DD") : "-"}
                    </Text>
                    <Text>
                      <ClockCircleOutlined /> <b>Vaqt:</b>{" "}
                      {activeAd.scheduled_at ? dayjs(activeAd.scheduled_at).format("HH:mm") : "-"}
                    </Text>
                    <Text>
                      <UserOutlined /> <b>Joylar:</b>{" "}
                      <b>{activeAd.seats_available ?? "-"}</b> / {activeAd.seats_total ?? "-"}
                    </Text>
                    <Text>
                      <b>Narx:</b> {formatMoney(activeAd.price)} so‘m
                    </Text>
                  </Space>

                  <Space size={10} wrap style={{ marginTop: 8 }}>
                    <Tag
                      color={activeAd.status === "pending" ? "green" : "gold"}
                      style={{ padding: "4px 10px", borderRadius: 999 }}
                    >
                      {activeAd.status === "pending" ? "Ochiq" : "Bron qilingan (joy kamaymoqda)"}
                    </Tag>
                    {Number(activeAd.seats_available || 0) <= 0 ? (
                      <Tag color="red" style={{ padding: "4px 10px", borderRadius: 999 }}>
                        Joylar to‘ldi
                      </Tag>
                    ) : null}
                  </Space>
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

            {/* Edit form */}
            {editMode ? (
              <div style={{ marginTop: 16 }}>
                <Divider orientation="left">Tahrirlash</Divider>

                <Row gutter={12}>
                  <Col xs={24} md={12}>
                    <Text type="secondary">Qayerdan viloyat</Text>
                    <Select
                      value={formData.fromRegion}
                      onChange={(v) => setFormData((p) => ({ ...p, fromRegion: v }))}
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
                    <Text type="secondary">Qayerdan tuman</Text>
                    <Select
                      value={formData.fromDistrict}
                      onChange={(v) => setFormData((p) => ({ ...p, fromDistrict: v }))}
                      style={{ width: "100%", marginTop: 6 }}
                      size="large"
                    >
                      {fromDistricts.map((d) => (
                        <Select.Option key={`${d}`} value={d}>
                          {districtLabel(d)}
                        </Select.Option>
                      ))}
                    </Select>
                    {isTashkentCity(formData.fromRegion) ? (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        * Toshkent shahri uchun tumanni tanlamasangiz ham bo‘ladi (Hammasi).
                      </Text>
                    ) : null}
                  </Col>
                </Row>

                <Divider />

                <Row gutter={12}>
                  <Col xs={24} md={12}>
                    <Text type="secondary">Qayerga viloyat</Text>
                    <Select
                      value={formData.toRegion}
                      onChange={(v) => setFormData((p) => ({ ...p, toRegion: v }))}
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
                    <Text type="secondary">Qayerga tuman</Text>
                    <Select
                      value={formData.toDistrict}
                      onChange={(v) => setFormData((p) => ({ ...p, toDistrict: v }))}
                      style={{ width: "100%", marginTop: 6 }}
                      size="large"
                    >
                      {toDistricts.map((d) => (
                        <Select.Option key={`${d}`} value={d}>
                          {districtLabel(d)}
                        </Select.Option>
                      ))}
                    </Select>
                    {isTashkentCity(formData.toRegion) ? (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        * Toshkent shahri uchun tumanni tanlamasangiz ham bo‘ladi (Hammasi).
                      </Text>
                    ) : null}
                  </Col>
                </Row>

                <Divider />

                <Row gutter={12}>
                  <Col xs={24} md={12}>
                    <Text type="secondary">Sana</Text>
                    <DatePicker
                      value={dayjs(formData.date)}
                      onChange={(d) => setFormData((p) => ({ ...p, date: d ? d.format("YYYY-MM-DD") : "" }))}
                      style={{ width: "100%", marginTop: 6 }}
                      size="large"
                    />
                  </Col>
                  <Col xs={24} md={12}>
                    <Text type="secondary">Vaqt</Text>
                    <TimePicker
                      value={dayjs(formData.time, "HH:mm")}
                      onChange={(tVal) => setFormData((p) => ({ ...p, time: tVal ? tVal.format("HH:mm") : "" }))}
                      format="HH:mm"
                      style={{ width: "100%", marginTop: 6 }}
                      size="large"
                    />
                  </Col>
                </Row>

                <Divider />

                <Row gutter={12}>
                  <Col xs={24} md={12}>
                    <Text type="secondary">Narx (so‘m)</Text>
                    <InputNumber
                      min={1000}
                      step={1000}
                      value={formData.price}
                      onChange={(v) => setFormData((p) => ({ ...p, price: Number(v || 0) }))}
                      style={{ width: "100%", marginTop: 6 }}
                      size="large"
                    />
                  </Col>

                  <Col xs={24} md={12}>
                    <Text type="secondary">O‘rindiqlar (faqat bron yo‘q bo‘lsa o‘zgaradi)</Text>
                    <InputNumber
                      min={1}
                      max={20}
                      value={formData.seatsTotal}
                      onChange={(v) => setFormData((p) => ({ ...p, seatsTotal: Number(v || 1) }))}
                      style={{ width: "100%", marginTop: 6 }}
                      size="large"
                      disabled={bookings.length > 0}
                    />
                    {bookings.length > 0 ? (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        * Bronlar bor: joylar sonini o‘zgartirish bloklangan.
                      </Text>
                    ) : null}
                  </Col>
                </Row>

                <Divider />

                <Button
                  type="primary"
                  size="large"
                  block
                  icon={<SaveOutlined />}
                  onClick={saveEdits}
                  loading={submitting}
                  style={{ borderRadius: 14, height: 48 }}
                >
                  Saqlash
                </Button>
              </div>
            ) : null}

            {/* Bookings list */}
            <div style={{ marginTop: 18 }}>
              <Divider orientation="left">Bronlar (yo‘lovchilar)</Divider>

              {bookings.length === 0 ? (
                <Text type="secondary">Hozircha bron yo‘q. Yo‘lovchi “Band qilish” bosganda shu yerda chiqadi.</Text>
              ) : (
                <List
                  dataSource={bookings}
                  itemLayout="horizontal"
                  renderItem={(b) => (
                    <List.Item>
                      <List.Item.Meta
                        title={
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <Tag color="blue">{b.seats} ta joy</Tag>
                            <span style={{ fontWeight: 600 }}>{b.passenger_name || "Yo‘lovchi"}</span>
                          </div>
                        }
                        description={
                          <div>
                            <div>
                              <Text type="secondary">Telefon:</Text> <b>{b.passenger_phone || "-"}</b>
                            </div>
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
            </div>
          </Card>
        ) : (
          // Create form
          <Card style={{ borderRadius: 18, border: "none", boxShadow: "0 6px 20px rgba(0,0,0,0.06)" }}>
            <Title level={5} style={{ marginTop: 0 }}>
              Yangi e’lon yaratish
            </Title>

            <Divider orientation="left">Qayerdan</Divider>
            <Row gutter={12}>
              <Col xs={24} md={12}>
                <Text type="secondary">Viloyat</Text>
                <Select
                  value={formData.fromRegion}
                  onChange={(v) => setFormData((p) => ({ ...p, fromRegion: v }))}
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
                  value={formData.fromDistrict}
                  onChange={(v) => setFormData((p) => ({ ...p, fromDistrict: v }))}
                  style={{ width: "100%", marginTop: 6 }}
                  size="large"
                >
                  {fromDistricts.map((d) => (
                    <Select.Option key={`${d}`} value={d}>
                      {districtLabel(d)}
                    </Select.Option>
                  ))}
                </Select>
                {isTashkentCity(formData.fromRegion) ? (
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
                  value={formData.toRegion}
                  onChange={(v) => setFormData((p) => ({ ...p, toRegion: v }))}
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
                  value={formData.toDistrict}
                  onChange={(v) => setFormData((p) => ({ ...p, toDistrict: v }))}
                  style={{ width: "100%", marginTop: 6 }}
                  size="large"
                >
                  {toDistricts.map((d) => (
                    <Select.Option key={`${d}`} value={d}>
                      {districtLabel(d)}
                    </Select.Option>
                  ))}
                </Select>
                {isTashkentCity(formData.toRegion) ? (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    * Toshkent shahri uchun tumanni tanlamasangiz ham bo‘ladi (Hammasi).
                  </Text>
                ) : null}
              </Col>
            </Row>

            <Divider />

            <Row gutter={12}>
              <Col xs={24} md={12}>
                <Text type="secondary">Sana</Text>
                <DatePicker
                  value={dayjs(formData.date)}
                  onChange={(d) => setFormData((p) => ({ ...p, date: d ? d.format("YYYY-MM-DD") : "" }))}
                  style={{ width: "100%", marginTop: 6 }}
                  size="large"
                />
              </Col>
              <Col xs={24} md={12}>
                <Text type="secondary">Vaqt</Text>
                <TimePicker
                  value={dayjs(formData.time, "HH:mm")}
                  onChange={(tVal) => setFormData((p) => ({ ...p, time: tVal ? tVal.format("HH:mm") : "" }))}
                  format="HH:mm"
                  style={{ width: "100%", marginTop: 6 }}
                  size="large"
                />
              </Col>
            </Row>

            <Divider />

            <Row gutter={12}>
              <Col xs={24} md={12}>
                <Text type="secondary">Bo‘sh o‘rindiqlar</Text>
                <InputNumber
                  min={1}
                  max={20}
                  value={formData.seatsTotal}
                  onChange={(v) => setFormData((p) => ({ ...p, seatsTotal: Number(v || 1) }))}
                  style={{ width: "100%", marginTop: 6 }}
                  size="large"
                />
              </Col>
              <Col xs={24} md={12}>
                <Text type="secondary">Narx (so‘m)</Text>
                <InputNumber
                  min={1000}
                  step={1000}
                  value={formData.price}
                  onChange={(v) => setFormData((p) => ({ ...p, price: Number(v || 0) }))}
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
              E’lonni yaratish
            </Button>

            <div style={{ marginTop: 10 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                * E’lon yaratilgandan so‘ng yo‘lovchi “Viloyatlar aro” sahifasida aynan shu yo‘nalish bo‘yicha qidirsa,
                sizning e’loningiz chiqadi.
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                * Toshkent shahri uchun tumanni tanlamasangiz, yo‘lovchi Toshkent shahri ichidagi istalgan tumanni tanlab qidirsa ham
                sizning e’lon chiqadi (wildcard).
              </Text>
            </div>
          </Card>
        )}
      </div>
    </ConfigProvider>
  );
}