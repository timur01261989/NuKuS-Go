import React, { useState, useEffect, useCallback } from "react";
import { Button, Result, Card, Skeleton, message, Typography } from "antd";
import { ClockCircleOutlined, StopOutlined, ReloadOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { supabase } from "@lib/supabase";
import DriverHome from "./DriverHome";
import DriverRegister from "./DriverRegister";

const { Title, Text } = Typography;

export default function DriverAuth({ onBack }) {
  const navigate = useNavigate();

  // Statuslar: 'loading' | 'none' | 'pending' | 'active' | 'blocked'
  const [status, setStatus] = useState("loading");
  const [loading, setLoading] = useState(false); // Tugma uchun loading


  const normalizeDriverStatus = (raw) => {
    // DB'dagi turli qiymatlarni UI statuslariga moslaymiz
    if (!raw) return "none";
    const v = typeof raw === "string" ? raw.trim().toLowerCase() : raw;

    // aniq moslar
    if (v === "loading" || v === "none" || v === "pending" || v === "active" || v === "blocked") return v;

    // boolean/number holatlar
    if (v === true || v === 1) return "active";
    if (v === false || v === 0) return "pending";

    // keng tarqalgan sinonimlar
    if (["approved", "verified", "enabled", "ok"].includes(v)) return "active";
    if (["inactive", "disabled", "banned", "ban", "blocked_by_admin"].includes(v)) return "blocked";
    if (["review", "checking", "awaiting", "waiting", "new"].includes(v)) return "pending";

    return "pending";
  };

  // --- 1. HAYDOVCHI STATUSINI TEKSHIRISH (LOGIKA) ---
  const checkDriverStatus = useCallback(async () => {
    try {
      // Har doim loading ga o'tkazamiz (shart yo'q)
      setStatus("loading");

      // 1. Foydalanuvchi tizimga kirganmi?
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // Login yo'q: redirect qilish o'rniga login talab qilamiz (redirect loop bo'lmasin)
        setStatus("need_login");
        return;
      }

      // 2. Bazadan haydovchini qidiramiz
      const { data, error } = await supabase
        .from("drivers")
        .select("status, approved, user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Baza xatosi:", error);
        message.error("Tizimda xatolik yuz berdi");
      }

      // 3. Statusni aniqlash
      if (!data) {
        setStatus("none"); // Bazada yo'q -> Ro'yxatdan o'tishga
      } else {
        setStatus(data.approved ? "active" : normalizeDriverStatus(data.status)); // 'pending' | 'active' | 'blocked' (normalizatsiya)
      }
    } catch (err) {
      console.error("Tarmoq xatosi:", err);
      message.error("Internet aloqasini tekshiring");
    }
  }, [navigate, onBack]);

  // Sahifa ochilganda ishga tushadi
  useEffect(() => {
    checkDriverStatus();
  }, [checkDriverStatus]);

  // --- YORDAMCHI FUNKSIYALAR ---

  // Asosiy ilovaga qaytish
  const goBackMain = () => {
    if (onBack) onBack();
    else navigate("/");
  };

  // Statusni qayta tekshirish (Refresh)
  const handleRefresh = async () => {
    setLoading(true);
    await checkDriverStatus();

    // 1 soniyadan keyin loadingni o'chiramiz (chiroyli effekt uchun)
    setTimeout(() => {
      setLoading(false);
      if (status === "pending") message.info("Hozircha o'zgarish yo'q, kuting...");
    }, 1000);
  };

  // --- RENDER QISMI (ROUTER) ---

  // 1. YUKLANMOQDA (SKELETON)
  if (status === "loading") {
    return (
      <div
        style={{
          padding: 40,
          background: "var(--bg-layout)",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <Skeleton.Button active size="large" block style={{ height: 50 }} />
        <Skeleton active avatar paragraph={{ rows: 4 }} />
        <Skeleton.Image active style={{ width: "100%", height: 200 }} />
      </div>
    );
  }

  
  // 1.5 LOGIN KERAK
  if (status === "need_login") {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-layout)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <Card style={{ width: "100%", maxWidth: 420, borderRadius: 24, border: "none", boxShadow: "var(--shadow-soft)" }}>
          <Result
            icon={<StopOutlined style={{ color: "#ff4d4f", fontSize: 64 }} />}
            title={<Title level={4} style={{ marginBottom: 0 }}>Haydovchi bo'limiga kirish uchun login qiling</Title>}
            subTitle={<Text type="secondary">Sessiya topilmadi. Avval tizimga kiring, so'ng haydovchi bo'limini oching.</Text>}
            extra={[
              <Button key="login" type="primary" size="large" style={{ width: "100%", borderRadius: 14, height: 48, fontWeight: 900 }} onClick={() => navigate("/login")}>
                Login
              </Button>,
              <Button key="back" size="large" style={{ width: "100%", borderRadius: 14, height: 48, fontWeight: 700 }} icon={<ArrowLeftOutlined />} onClick={goBackMain}>
                Orqaga
              </Button>,
            ]}
          />
        </Card>
      </div>
    );
  }

// 2. AKTIV HAYDOVCHI -> ISH STOLIGA (DRIVER HOME)
  if (status === "active") {
    // Eng muhim joyi: Agar active bo'lsa, biz boshqaruvni DriverHome ga beramiz.
    // onLogout funksiyasi DriverHome dagi "Chiqish" tugmasi uchun.
    return <DriverHome onLogout={goBackMain} />;
  }

  // 3. YANGI FOYDALANUVCHI -> RO'YXATDAN O'TISH
  if (status === "none") {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-layout)" }}>
        <div style={{ padding: "15px 15px 0" }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={goBackMain}
            style={{
              border: "none",
              height: 40,
              borderRadius: 12,
              fontWeight: 600,
            }}
          >
            Asosiy menyuga qaytish
          </Button>
        </div>

        {/* Ro'yxatdan o'tib bo'lgach, statusni 'pending' ga o'zgartiramiz */}
        <DriverRegister onRegisterSuccess={() => setStatus("pending")} />
      </div>
    );
  }

  // 4. KUTILMOQDA (PENDING)
  if (status === "pending") {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          background: "var(--bg-layout)",
          padding: 20,
        }}
      >
        <Card
          style={{
            width: "100%",
            maxWidth: 400,
            textAlign: "center",
            borderRadius: 30,
            border: "none",
            boxShadow: "var(--shadow-soft)",
          }}
        >
          <Result
            icon={<ClockCircleOutlined style={{ color: "#faad14", fontSize: 70 }} />}
            title={
              <Title level={3} style={{ marginBottom: 0 }}>
                Arizangiz ko'rib chiqilmoqda
              </Title>
            }
            subTitle={
              <Text type="secondary">
                Sizning ma'lumotlaringiz Admin tomonidan tekshirilmoqda. Bu jarayon biroz vaqt olishi mumkin.
              </Text>
            }
            extra={[
              <Button
                key="refresh"
                type="primary"
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
                loading={loading}
                size="large"
                style={{
                  width: "100%",
                  borderRadius: 15,
                  marginBottom: 15,
                  height: 50,
                  fontWeight: 900,
                }}
              >
                Holatni tekshirish
              </Button>,
              <Button
                key="back"
                onClick={goBackMain}
                size="large"
                style={{
                  width: "100%",
                  borderRadius: 15,
                  height: 50,
                }}
              >
                Ortga qaytish
              </Button>,
            ]}
          />
        </Card>
      </div>
    );
  }

  // 5. BLOKLANGAN (BLOCKED)
  if (status === "blocked") {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          background: "var(--bg-layout)",
          padding: 20,
        }}
      >
        <Card
          style={{
            width: "100%",
            maxWidth: 400,
            textAlign: "center",
            borderRadius: 30,
            border: "none",
          }}
        >
          <Result
            icon={<StopOutlined style={{ color: "#ff4d4f", fontSize: 70 }} />}
            status="error"
            title={
              <Title level={3} style={{ marginBottom: 0 }}>
                Profilingiz Bloklandi
              </Title>
            }
            subTitle="Qoidabuzarlik yoki to'lovlar sababli sizning haydovchilik profilingiz vaqtincha to'xtatildi."
            extra={[
              <Button
                key="contact"
                type="primary"
                danger
                size="large"
                style={{
                  width: "100%",
                  borderRadius: 15,
                  marginBottom: 10,
                  height: 50,
                  fontWeight: 900,
                }}
              >
                Admin bilan bog'lanish
              </Button>,
              <Button
                key="back"
                onClick={goBackMain}
                size="large"
                style={{
                  width: "100%",
                  borderRadius: 15,
                  height: 50,
                }}
              >
                Chiqish
              </Button>,
            ]}
          />
        </Card>
      </div>
    );
  }

  // Fallback: hech qaysi statusga tushmasa, qora ekran bo'lib qolmasin
  return (
    <div style={{ padding: 16, maxWidth: 520, margin: "0 auto" }}>
      <Card bordered={false} style={{ borderRadius: 20 }}>
        <Result
          status="warning"
          title="Haydovchi statusi noma'lum"
          subTitle="Profil status qiymati kutilgan formatda emas. Iltimos, sahifani yangilang yoki admin bilan tekshiring."
          extra={[
            <Button key="reload" type="primary" icon={<ReloadOutlined />} onClick={checkDriverStatus}>
              Qayta tekshirish
            </Button>,
            <Button key="back" onClick={goBackMain}>
              Orqaga
            </Button>,
          ]}
        />
      </Card>
    </div>
  );
}
