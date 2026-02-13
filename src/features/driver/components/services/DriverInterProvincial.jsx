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
  Popconfirm,
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
  WalletOutlined,
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
const districtLabel = (district) => (district && district.trim() ? district : "Hammasi");
const formatMoney = (n) => Number(n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

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

  const [activeAd, setActiveAd] = useState(null);
  const [editMode, setEditMode] = useState(false);

  // Requests (passenger -> driver)
  const [requests, setRequests] = useState([]);
  // Accepted bookings
  const [bookings, setBookings] = useState([]);

  // Notifications
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Wallet
  const [wallet, setWallet] = useState({ balance: 0 });
  const [topupOpen, setTopupOpen] = useState(false);
  const [topupAmount, setTopupAmount] = useState(10000);

  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem("driverInterProvDraft_v3");
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

  const fromDistricts = useMemo(() => {
    const list = getDistricts(formData.fromRegion);
    if (isTashkentCity(formData.fromRegion)) return ["", ...list];
    return list;
  }, [formData.fromRegion]);

  const toDistricts = useMemo(() => {
    const list = getDistricts(formData.toRegion);
    if (isTashkentCity(formData.toRegion)) return ["", ...list];
    return list;
  }, [formData.toRegion]);

  useEffect(() => {
    if (!fromDistricts.includes(formData.fromDistrict)) {
      setFormData((p) => ({ ...p, fromDistrict: fromDistricts[0] ?? "" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.fromRegion]);

  useEffect(() => {
    if (!toDistricts.includes(formData.toDistrict)) {
      setFormData((p) => ({ ...p, toDistrict: toDistricts[0] ?? "" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.toRegion]);

  useEffect(() => {
    localStorage.setItem("driverInterProvDraft_v3", JSON.stringify(formData));
  }, [formData]);

  const validate = () => {
    if (!formData.fromRegion) return message.error("Qayerdan viloyatini tanlang!"), false;
    if (!isTashkentCity(formData.fromRegion) && (!formData.fromDistrict || !formData.fromDistrict.trim())) {
      message.error("Qayerdan tumanini tanlang!");
      return false;
    }
    if (!formData.toRegion) return message.error("Qayerga viloyatini tanlang!"), false;
    if (!isTashkentCity(formData.toRegion) && (!formData.toDistrict || !formData.toDistrict.trim())) {
      message.error("Qayerga tumanini tanlang!");
      return false;
    }
    if (!formData.date || !formData.time) return message.error("Sana va vaqtni tanlang!"), false;
    if (!formData.seatsTotal || formData.seatsTotal < 1) return message.error("Joylar kamida 1!"), false;
    if (!formData.price || formData.price < 1000) return message.error("Narxni to‘g‘ri kiriting!"), false;
    return true;
  };

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

  const loadRequests = async (orderId) => {
    const { data, error } = await supabase
      .from("trip_booking_requests")
      .select("*")
      .eq("order_id", orderId)
      .eq("status", "requested")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
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

  const loadWallet = async (userId) => {
    const { data, error } = await supabase
      .from("driver_wallets")
      .select("*")
      .eq("driver_id", userId)
      .maybeSingle();
    if (error) throw error;
    return data || { balance: 0 };
  };

  const fillFormFromActive = (o) => {
    if (!o) return;
    const sched = o.scheduled_at ? dayjs(o.scheduled_at) : null;
    setFormData({
      fromRegion: o.from_region || "Qoraqalpog'iston",
      fromDistrict: o.from_district ?? "",
      toRegion: o.to_region || "Toshkent shahri",
      toDistrict: o.to_district ?? "",
      date: sched ? sched.format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"),
      time: sched ? sched.format("HH:mm") : "09:00",
      seatsTotal: Number(o.seats_total || 4),
      price: Number(o.price || 0),
    });
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const { data: authData, error: authErr } = await supabase.auth.getUser();
        if (authErr) throw authErr;
        const user = authData?.user;
        if (!user) return message.error("Avval tizimga kiring!");

        const ad = await loadActiveAd(user.id);
        setActiveAd(ad);
        if (ad) fillFormFromActive(ad);

        const notifs = await loadNotifications(user.id);
        setNotifications(notifs);

        const w = await loadWallet(user.id);
        setWallet(w);

        if (ad?.id) {
          const reqs = await loadRequests(ad.id);
          setRequests(reqs);
          const b = await loadBookings(ad.id);
          setBookings(b);
        }

        // Realtime refresh (requests, bookings, notifications, orders)
        const ch1 = supabase
          .channel("rt_driver_interprov")
          .on("postgres_changes", { event: "*", schema: "public", table: "trip_booking_requests" }, async () => {
            try {
              const fresh = await loadActiveAd(user.id);
              setActiveAd(fresh);
              if (fresh?.id) {
                const reqs = await loadRequests(fresh.id);
                setRequests(reqs);
              }
            } catch {}
          })
          .on("postgres_changes", { event: "*", schema: "public", table: "trip_bookings" }, async () => {
            try {
              const fresh = await loadActiveAd(user.id);
              setActiveAd(fresh);
              if (fresh?.id) {
                const b = await loadBookings(fresh.id);
                setBookings(b);
              }
            } catch {}
          })
          .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, async () => {
            try {
              const notifs2 = await loadNotifications(user.id);
              setNotifications(notifs2);
            } catch {}
          })
          .on("postgres_changes", { event: "*", schema: "public", table: "driver_wallets", filter: `driver_id=eq.${user.id}` }, async () => {
            try {
              const w2 = await loadWallet(user.id);
              setWallet(w2);
            } catch {}
          })
          .subscribe();

        return () => supabase.removeChannel(ch1);
      } catch (e) {
        console.error(e);
        message.error(e?.message || "Xatolik!");
      } finally {
        setTimeout(() => setLoading(false), 250);
      }
    };
    init();
  }, []);

  const createAd = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) return message.error("Avval tizimga kiring!");

      const scheduledAt = dayjs(`${formData.date} ${formData.time}`, "YYYY-MM-DD HH:mm").toISOString();

      const payload = {
        driver_id: user.id,
        service_type: "inter_prov",
        status: "pending",
        from_region: formData.fromRegion,
        from_district: (formData.fromDistrict || "").trim(),
        to_region: formData.toRegion,
        to_district: (formData.toDistrict || "").trim(),
        scheduled_at: scheduledAt,
        seats_total: formData.seatsTotal,
        seats_available: formData.seatsTotal,
        price: formData.price,
        pickup_location: `${formData.fromRegion}, ${districtLabel(formData.fromDistrict)}`,
        dropoff_location: `${formData.toRegion}, ${districtLabel(formData.toDistrict)}`,
      };

      const { data, error } = await supabase.from("orders").insert(payload).select("*").single();
      if (error) throw error;

      setActiveAd(data);
      setRequests([]);
      setBookings([]);
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

      // seats_total ni bronlar bo‘lsa o‘zgartirmaymiz
      const hasBookings = bookings.length > 0;
      const seatsPatch = hasBookings ? {} : { seats_total: formData.seatsTotal, seats_available: formData.seatsTotal };

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
      message.success("Saqlab qo‘yildi!");
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

  const acceptRequest = async (req) => {
    setSubmitting(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) return message.error("Avval tizimga kiring!");

      const { error } = await supabase.rpc("accept_booking_request", {
        p_request_id: req.id,
        p_driver_id: user.id,
      });
      if (error) throw error;

      message.success("So‘rov qabul qilindi. Endi yo‘lovchi bilan bog‘laning.");
    } catch (e) {
      console.error(e);
      message.error(e?.message || "Qabul qilishda xatolik!");
    } finally {
      setSubmitting(false);
    }
  };

  const rejectRequest = async (req) => {
    setSubmitting(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) return message.error("Avval tizimga kiring!");

      const { error } = await supabase.rpc("reject_booking_request", {
        p_request_id: req.id,
        p_driver_id: user.id,
        p_reason: "Rad etildi",
      });
      if (error) throw error;

      message.success("So‘rov rad etildi.");
    } catch (e) {
      console.error(e);
      message.error(e?.message || "Rad etishda xatolik!");
    } finally {
      setSubmitting(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const openNotifications = async () => {
    setNotifOpen(true);
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length) {
      await supabase.from("notifications").update({ is_read: true }).in("id", unreadIds);
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user?.id) {
        const notifs2 = await loadNotifications(authData.user.id);
        setNotifications(notifs2);
      }
    }
  };

  const topUpBalance = async () => {
    // Bu demo: real topup sizda click/payme bo‘ladi.
    // Hozircha admin/driver o‘zi qo‘shishi uchun transaction qilamiz.
    setSubmitting(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) return message.error("Avval tizimga kiring!");

      const amt = Number(topupAmount || 0);
      if (amt <= 0) return message.error("Summani to‘g‘ri kiriting!");

      // ensure wallet row
      await supabase.from("driver_wallets").upsert({ driver_id: user.id, balance: wallet.balance || 0 });

      const { data: w, error: werr } = await supabase
        .from("driver_wallets")
        .update({ balance: (wallet.balance || 0) + amt, updated_at: new Date().toISOString() })
        .eq("driver_id", user.id)
        .select("*")
        .single();
      if (werr) throw werr;

      await supabase.from("driver_transactions").insert({
        driver_id: user.id,
        amount: amt,
        reason: "topup_demo",
        meta: { source: "manual_demo" },
      });

      setWallet(w);
      setTopupOpen(false);
      message.success("Balans to‘ldirildi (demo).");
    } catch (e) {
      console.error(e);
      message.error(e?.message || "Topup xatolik!");
    } finally {
      setSubmitting(false);
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
    <ConfigProvider theme={{ token: { colorPrimary: "#1890ff", borderRadius: 12 } }}>
      <div style={{ padding: 16, maxWidth: 980, margin: "0 auto" }}>
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

          <Space>
            <Tag icon={<WalletOutlined />} color={Number(wallet.balance || 0) > 0 ? "green" : "red"}>
              Balans: {formatMoney(wallet.balance)} so‘m
            </Tag>
            <Button onClick={() => setTopupOpen(true)}>Balans to‘ldirish</Button>

            <Badge count={unreadCount} overflowCount={99}>
              <Button icon={<BellOutlined />} onClick={openNotifications}>
                Bildirishnomalar
              </Button>
            </Badge>
          </Space>
        </div>

        <Modal title="Balans to‘ldirish (demo)" open={topupOpen} onCancel={() => setTopupOpen(false)} onOk={topUpBalance} okText="Qo‘shish">
          <Text type="secondary">Summani kiriting:</Text>
          <InputNumber value={topupAmount} onChange={(v) => setTopupAmount(Number(v || 0))} style={{ width: "100%", marginTop: 8 }} min={0} step={1000} />
          <Text type="secondary" style={{ display: "block", marginTop: 10, fontSize: 12 }}>
            * Real loyihada bu joyga Payme/Click integratsiya qilinadi. Hozir test uchun.
          </Text>
        </Modal>

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
                    <Tag color={activeAd.status === "pending" ? "green" : "gold"} style={{ padding: "4px 10px", borderRadius: 999 }}>
                      {activeAd.status === "pending" ? "Ochiq" : "Joylar kamaymoqda"}
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
                  <Button icon={<EditOutlined />} block size="large" onClick={() => setEditMode((p) => !p)} style={{ borderRadius: 14, height: 44 }}>
                    {editMode ? "Tahrirni yopish" : "E’lonni tahrirlash"}
                  </Button>

                  <Button danger type="primary" icon={<DeleteOutlined />} block size="large" onClick={cancelAd} loading={submitting} style={{ borderRadius: 14, height: 44 }}>
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
                        <Select.Option key={r.name} value={r.name}>
                          {r.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Col>
                  <Col xs={24} md={12}>
                    <Text type="secondary">Qayerdan tuman</Text>
                    <Select value={formData.fromDistrict} onChange={(v) => setFormData((p) => ({ ...p, fromDistrict: v }))} style={{ width: "100%", marginTop: 6 }} size="large">
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
                    <Select value={formData.toRegion} onChange={(v) => setFormData((p) => ({ ...p, toRegion: v }))} style={{ width: "100%", marginTop: 6 }} size="large">
                      {REGIONS_DATA.map((r) => (
                        <Select.Option key={r.name} value={r.name}>
                          {r.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Col>
                  <Col xs={24} md={12}>
                    <Text type="secondary">Qayerga tuman</Text>
                    <Select value={formData.toDistrict} onChange={(v) => setFormData((p) => ({ ...p, toDistrict: v }))} style={{ width: "100%", marginTop: 6 }} size="large">
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
                    <Text type="secondary">O‘rindiqlar (bron bo‘lsa bloklanadi)</Text>
                    <InputNumber min={1} max={20} value={formData.seatsTotal} onChange={(v) => setFormData((p) => ({ ...p, seatsTotal: Number(v || 1) }))} style={{ width: "100%", marginTop: 6 }} size="large" disabled={bookings.length > 0} />
                    {bookings.length > 0 ? (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        * Bronlar bor: joylar sonini o‘zgartirish bloklangan.
                      </Text>
                    ) : null}
                  </Col>
                </Row>

                <Divider />

                <Button type="primary" size="large" block icon={<SaveOutlined />} onClick={saveEdits} loading={submitting} style={{ borderRadius: 14, height: 48 }}>
                  Saqlash
                </Button>
              </div>
            ) : null}

            {/* REQUESTS */}
            <div style={{ marginTop: 18 }}>
              <Divider orientation="left">So‘rovlar (qabul qilish kerak)</Divider>

              {requests.length === 0 ? (
                <Text type="secondary">Hozircha so‘rov yo‘q. Yo‘lovchi “Band qilish” bosganda so‘rov keladi.</Text>
              ) : (
                <List
                  dataSource={requests}
                  itemLayout="horizontal"
                  renderItem={(r) => (
                    <List.Item
                      actions={[
                        <Popconfirm
                          key="acc"
                          title="So‘rovni qabul qilasizmi?"
                          description="Qabul qilinsa joylar kamayadi va balansdan komissiya yechiladi."
                          onConfirm={() => acceptRequest(r)}
                        >
                          <Button type="primary" icon={<CheckOutlined />} loading={submitting}>
                            Qabul qilish
                          </Button>
                        </Popconfirm>,
                        <Popconfirm key="rej" title="So‘rovni rad etasizmi?" onConfirm={() => rejectRequest(r)}>
                          <Button danger icon={<CloseOutlined />} loading={submitting}>
                            Rad etish
                          </Button>
                        </Popconfirm>,
                      ]}
                    >
                      <List.Item.Meta
                        title={
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <Tag color="blue">{r.seats} ta joy</Tag>
                            <span style={{ fontWeight: 600 }}>{r.passenger_name || "Yo‘lovchi"}</span>
                          </div>
                        }
                        description={
                          <div>
                            <div>
                              <Text type="secondary">Telefon:</Text> <b>Qabul qilingandan keyin ko‘rinadi</b>
                            </div>
                            {r.note ? (
                              <div>
                                <Text type="secondary">Izoh:</Text> {r.note}
                              </div>
                            ) : null}
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
            </div>

            {/* BOOKINGS */}
            <div style={{ marginTop: 18 }}>
              <Divider orientation="left">Qabul qilingan bronlar</Divider>

              {bookings.length === 0 ? (
                <Text type="secondary">Hozircha qabul qilingan bron yo‘q.</Text>
              ) : (
                <List
                  dataSource={bookings}
                  itemLayout="horizontal"
                  renderItem={(b) => (
                    <List.Item>
                      <List.Item.Meta
                        title={
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <Tag color="green">{b.seats} ta joy</Tag>
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
                            <div style={{ marginTop: 6 }}>
                              <Tag color="geekblue">Yo‘lovchi bilan bog‘laning</Tag>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {" "}
                                (Qabul qilingandan keyin telefon ko‘rinadi)
                              </Text>
                            </div>
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
          <Card style={{ borderRadius: 18, border: "none", boxShadow: "0 6px 20px rgba(0,0,0,0.06)" }}>
            <Title level={5} style={{ marginTop: 0 }}>
              Yangi e’lon yaratish
            </Title>

            <Divider orientation="left">Qayerdan</Divider>
            <Row gutter={12}>
              <Col xs={24} md={12}>
                <Text type="secondary">Viloyat</Text>
                <Select value={formData.fromRegion} onChange={(v) => setFormData((p) => ({ ...p, fromRegion: v }))} style={{ width: "100%", marginTop: 6 }} size="large">
                  {REGIONS_DATA.map((r) => (
                    <Select.Option key={r.name} value={r.name}>
                      {r.name}
                    </Select.Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} md={12}>
                <Text type="secondary">Tuman/Shahar</Text>
                <Select value={formData.fromDistrict} onChange={(v) => setFormData((p) => ({ ...p, fromDistrict: v }))} style={{ width: "100%", marginTop: 6 }} size="large">
                  {fromDistricts.map((d) => (
                    <Select.Option key={`${d}`} value={d}>
                      {districtLabel(d)}
                    </Select.Option>
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
                    <Select.Option key={r.name} value={r.name}>
                      {r.name}
                    </Select.Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} md={12}>
                <Text type="secondary">Tuman/Shahar</Text>
                <Select value={formData.toDistrict} onChange={(v) => setFormData((p) => ({ ...p, toDistrict: v }))} style={{ width: "100%", marginTop: 6 }} size="large">
                  {toDistricts.map((d) => (
                    <Select.Option key={`${d}`} value={d}>
                      {districtLabel(d)}
                    </Select.Option>
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
                <Text type="secondary">Bo‘sh o‘rindiqlar</Text>
                <InputNumber min={1} max={20} value={formData.seatsTotal} onChange={(v) => setFormData((p) => ({ ...p, seatsTotal: Number(v || 1) }))} style={{ width: "100%", marginTop: 6 }} size="large" />
              </Col>
              <Col xs={24} md={12}>
                <Text type="secondary">Narx (so‘m)</Text>
                <InputNumber min={1000} step={1000} value={formData.price} onChange={(v) => setFormData((p) => ({ ...p, price: Number(v || 0) }))} style={{ width: "100%", marginTop: 6 }} size="large" />
              </Col>
            </Row>

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