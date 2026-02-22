import React, { useEffect, useState } from "react";
import { Button, Card, Typography, Spin, message } from "antd";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const { Title, Text } = Typography;

// Pending sahifasi: haydovchi tasdiqlanishini kutadi.
// Tasdiq bo'lganini tekshirish: 1) profiles.role === 'driver' 2) driver_applications.status === 'approved'
export default function DriverPending() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const isApprovedStatus = (v) =>
    typeof v === "string" && ["approved", "active", "verified", "enabled", "ok"].includes(v.toLowerCase());

  const checkApprovedAndRedirect = async (opts = { showToast: false }) => {
    try {
      setCheckingStatus(true);

      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr) {
        // Auth bo'lmasa login ga qaytarish (pendingda qolib ketmasin)
        console.error("Auth getUser error:", authErr);
        navigate("/login", { replace: true });
        return;
      }

      const userId = authData?.user?.id;
      if (!userId) {
        navigate("/login", { replace: true });
        return;
      }

      // 1) Avvalo profiles dan rolni tekshiramiz (admin tasdiqlaganda shuni o'zgartiryapsiz)
      const { data: profile, error: profErr } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();

      if (profErr) {
        console.error("profiles role tekshirish xato:", profErr);
      }

      if (profile?.role && String(profile.role).toLowerCase() === "driver") {
        if (opts.showToast) message.success("Siz tasdiqlandingiz! Dashboordga yo'natilmoqda...");
        navigate("/driver/dashboard", { replace: true });
        return;
      }

      // 2) Agar role hali driver bo'lmasa, driver_applications dagi eng oxirgi arizani tekshiramiz
      const { data: app, error: appErr } = await supabase
        .from("driver_applications")
        .select("status, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (appErr) {
        console.error("driver_applications tekshirish xato:", appErr);
        return;
      }

      if (app && isApprovedStatus(app.status)) {
        // Bu holatda admin arizani approved qilgan, lekin profiles.role hali yangilanmagan bo'lishi mumkin.
        // Biz bu yerda profiles ni update qilmaymiz (RLS sababli ko'pincha ruxsat yo'q).
        // Admin update qilgandan keyin yoki trigger orqali role yangilansa avtomatik o'tadi.
        if (opts.showToast) message.success("Ariza tasdiqlangan! Dashboordga yo'natilmoqda...");
        navigate("/driver/dashboard", { replace: true });
        return;
      }
    } catch (err) {
      console.error("Status tekshirish xatosi:", err);
    } finally {
      setCheckingStatus(false);
    }
  };

  // Har 3 soniyada status tekshirish
  useEffect(() => {
    let interval;

    // Avvalo darhol tekshir
    checkApprovedAndRedirect();

    // Keyin 3 soniyada bir tekshir
    interval = setInterval(() => checkApprovedAndRedirect(), 3000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await checkApprovedAndRedirect({ showToast: true });
      // Agar hali ham pending bo'lsa, info ko'rsatamiz
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;
      if (!userId) return;

      const { data: app } = await supabase
        .from("driver_applications")
        .select("status, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!app) {
        message.info("Ariza topilmadi. Qaytadan ro'yxatdan o'ting.");
      } else {
        message.info(`Holatingiz: ${app.status || "pending"}. Admin tekshiruvda...`);
      }
    } catch (err) {
      message.error("Tekshirishda xato: " + (err?.message || ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "#f5f6f8" }}>
      <Card style={{ width: 450, maxWidth: "100%", borderRadius: 16 }}>
        <Title level={4} style={{ marginTop: 0 }}>⏳ Haydovchi tasdiqlanmagan</Title>
        <Text type="secondary">
          Sizning haydovchi profilingiz admin tomonidan tekshirilmoqda. Tasdiqlangandan keyin haydovchi rejimiga avtomatik kirish amalga oshadi.
        </Text>

        <div style={{ marginTop: 20, padding: 12, background: "#f0f0f0", borderRadius: 8 }}>
          {checkingStatus && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Spin size="small" />
              <Text type="secondary" style={{ fontSize: 12 }}>Status tekshirilmoqda...</Text>
            </div>
          )}
          {!checkingStatus && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Status har 3 soniyada avtomatik tekshiriladi. Shuningdek quyidagi "Qayta tekshir" tugmasini bosishingiz mumkin.
            </Text>
          )}
        </div>

        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
          <Button
            type="primary"
            style={{ background: "#000", borderColor: "#000" }}
            onClick={handleRefresh}
            loading={loading}
            block
          >
            Qayta tekshir
          </Button>

          <Button
            onClick={() => navigate("/client")}
            block
          >
            Yolovchi rejimiga qaytish
          </Button>
        </div>
      </Card>
    </div>
  );
}
