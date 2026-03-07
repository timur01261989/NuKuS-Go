import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  Drawer,
  Typography,
  Divider,
  Switch as AntSwitch,
  message,
  Avatar,
} from "antd";
import {
  MenuOutlined,
  CarOutlined,
  SettingOutlined,
  HistoryOutlined,
  CustomerServiceOutlined,
  LogoutOutlined,
  UserOutlined,
  CheckCircleOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../../../lib/supabase";
import { useLanguage } from "../../../shared/i18n/useLanguage";
import { startTracking } from "../components/services/locationService";
import DriverHome from "../components/DriverHome";
import { DriverOnlineProvider } from "../core/DriverOnlineContext";

const { Title, Text } = Typography;

/**
 * Foydalanuvchi ism-familiyasidan bosh harflarni olish (Avatar uchun)
 */
function initials(name) {
  const s = String(name || "").trim();
  if (!s) return "D";
  const parts = s.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("") || "D";
}

export default function DriverDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  // =========================
  // STATE (Holatlar)
  // =========================
  const [gateLoading, setGateLoading] = useState(true);
  const [gateAllowed, setGateAllowed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profile, setProfile] = useState({ fullName: "", avatarUrl: "", phone: "" });
  const [loading, setLoading] = useState(false);

  // Online statusni localStorage dan yoki default "0" (offline) deb boshlaymiz
  const [isOnline, setIsOnline] = useState(() => {
    const v = localStorage.getItem("driverOnline");
    return v === "1";
  });

  // =========================
  // 1. AUTH VA PROFILNI TEKSHIRISH
  // =========================
  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      try {
        const { data: authData, error: authErr } = await supabase.auth.getUser();
        if (authErr || !authData?.user) {
          // RoleGate handles redirects, but we ensure safe exit
          return;
        }

        const userId = authData.user.id;

        // Haydovchi ma'lumotlarini bazadan olish
        const { data: driverData, error: driverErr } = await supabase
          .from("drivers")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (driverErr) {
          console.error("Profil yuklashda xato:", driverErr);
        }

        if (isMounted && driverData) {
          setProfile({
            fullName: `${driverData.first_name || ""} ${driverData.last_name || ""}`.trim(),
            phone: driverData.phone,
            avatarUrl: driverData.avatar_url || "",
          });

          // Bazadagi online statusni sinxronlash
          const onlineStatus = driverData.is_online === true;
          setIsOnline(onlineStatus);
          localStorage.setItem("driverOnline", onlineStatus ? "1" : "0");

          if (onlineStatus) {
            startTracking();
          }

          setGateAllowed(true);
        }
      } catch (e) {
        console.error("Driver dashboard gate error:", e);
      } finally {
        if (isMounted) setGateLoading(false);
      }
    };

    run();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  // =========================
  // 2. ONLINE / OFFLINE TUGMASI MANTIQI
  // =========================
  const toggleOnline = async (checked) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Foydalanuvchi topilmadi");

      const { error } = await supabase
        .from("drivers")
        .update({
          is_online: checked,
          last_seen_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) throw error;

      setIsOnline(checked);
      localStorage.setItem("driverOnline", checked ? "1" : "0");

      if (checked) {
        message.success(t?.onlineSuccess || "Siz Online bo'ldingiz.");
        startTracking();
      } else {
        message.warning(t?.offlineSuccess || "Siz Offline bo'ldingiz.");
      }
    } catch (err) {
      console.error("Status o'zgartirishda xato:", err);
      message.error("Statusni o'zgartirishda xatolik yuz berdi!");
      setIsOnline(!checked); 
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // 3. NAVIGATSIYA VA CHIQISH
  // =========================
  const go = (path) => {
    setDrawerOpen(false);
    navigate(path);
  };

  const onLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.clear();
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  // =========================
  // 4. RENDER (YUKLANISH HOLATI)
  // =========================
  if (gateLoading) {
    return (
      <div style={{ 
        padding: 48, 
        textAlign: "center", 
        minHeight: "100vh", 
        display: "flex", 
        flexDirection: "column", 
        justifyContent: "center", 
        alignItems: "center" 
      }}>
        <div className="loader" style={{ marginBottom: 16 }}></div>
        <Text>{t?.loading || "Yuklanmoqda..."}</Text>
      </div>
    );
  }

  if (!gateAllowed) {
    return null;
  }

  return (
    <DriverOnlineProvider>
      <div style={{ background: "#f5f5f5", minHeight: "100vh", paddingBottom: 80 }}>
        
        {/* HEADER / SHAPKA */}
        <div
          style={{
            background: "#fff",
            padding: "16px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            position: "sticky",
            top: 0,
            zIndex: 100,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Avatar
              size={40}
              style={{ backgroundColor: "#1677ff" }}
              icon={<UserOutlined />}
              src={profile.avatarUrl}
            >
              {initials(profile.fullName)}
            </Avatar>
            <div>
              <Text strong style={{ fontSize: 16, display: "block", lineHeight: 1.2 }}>
                {profile.fullName || "Haydovchi"}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {profile.phone || "+998 -- --- -- --"}
              </Text>
            </div>
          </div>

          <Button
            type="text"
            icon={<MenuOutlined style={{ fontSize: 20 }} />}
            onClick={() => setDrawerOpen(true)}
          />
        </div>

        {/* STATUS KARTASI (ONLINE/OFFLINE) */}
        <div style={{ padding: 16 }}>
          <Card
            style={{
              borderRadius: 16,
              border: "none",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              background: isOnline ? "linear-gradient(135deg, #f6ffed 0%, #ffffff 100%)" : "#fff",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: isOnline ? "#f6ffed" : "#fff1f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: isOnline ? "1px solid #b7eb8f" : "1px solid #ffa39e",
                  }}
                >
                  {isOnline ? (
                    <CheckCircleOutlined style={{ fontSize: 24, color: "#52c41a" }} />
                  ) : (
                    <StopOutlined style={{ fontSize: 24, color: "#f5222d" }} />
                  )}
                </div>
                <div>
                  <Text strong style={{ fontSize: 16, display: "block" }}>
                    {isOnline ? t?.online || "Siz Onlaynsiz" : t?.offline || "Siz Offlaynsiz"}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {isOnline ? "Buyurtmalar qabul qilinmoqda" : "Hozir dam olish rejimi"}
                  </Text>
                </div>
              </div>

              <AntSwitch
                checkedChildren="ON"
                unCheckedChildren="OFF"
                checked={isOnline}
                loading={loading}
                onChange={toggleOnline}
                style={{ transform: "scale(1.2)" }}
              />
            </div>
          </Card>
        </div>

        {/* ASOSIY XIZMATLAR (DriverHome) */}
        <div style={{ padding: "0 4px" }}>
            <DriverHome onLogout={onLogout} />
        </div>

        {/* QO'SHIMCHA MENYU TUGMALARI */}
        <div style={{ padding: "0 16px", marginTop: 16 }}>
          <Button
            block
            icon={<HistoryOutlined />}
            style={{
              height: 56,
              borderRadius: 16,
              marginBottom: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              fontSize: 16,
              fontWeight: 500,
            }}
            onClick={() => go("/driver/orders")}
          >
            {t?.orderHistoryDriver || "Buyurtmalar tarixi"}
          </Button>

          <Button
            block
            icon={<SettingOutlined />}
            style={{
              height: 56,
              borderRadius: 16,
              marginBottom: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              fontSize: 16,
              fontWeight: 500,
            }}
            onClick={() => go("/settings")}
          >
            {t?.settings || "Sozlamalar"}
          </Button>

          <Button
            block
            icon={<CustomerServiceOutlined />}
            style={{
              height: 56,
              borderRadius: 16,
              marginBottom: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              fontSize: 16,
              fontWeight: 500,
            }}
            onClick={() => go("/support")}
          >
            {t?.support || "Qo‘llab-quvvatlash"}
          </Button>

          <Button
            block
            danger
            icon={<LogoutOutlined />}
            style={{
              height: 56,
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              fontSize: 16,
              fontWeight: 500,
              marginTop: 20,
            }}
            onClick={onLogout}
          >
            {t?.logout || "Chiqish"}
          </Button>
        </div>

        {/* YON DASHBOARD (DRAWER) */}
        <Drawer 
            title={t?.menu || "Menyu"} 
            placement="left" 
            onClose={() => setDrawerOpen(false)} 
            open={drawerOpen} 
            width={280}
        >
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <Avatar 
                size={64} 
                icon={<UserOutlined />} 
                src={profile.avatarUrl} 
                style={{ marginBottom: 12, backgroundColor: "#1677ff" }} 
            />
            <Title level={4} style={{ margin: 0 }}>{profile.fullName}</Title>
            <Text type="secondary">{profile.phone}</Text>
          </div>
          <Divider />
          <Button 
            type="text" 
            block 
            style={{ textAlign: "left", height: 45, fontSize: 16 }} 
            icon={<CarOutlined />} 
            onClick={() => go("/driver/home")}
          >
            {t?.home || "Asosiy"}
          </Button>
          <Button 
            type="text" 
            block 
            style={{ textAlign: "left", height: 45, fontSize: 16 }} 
            icon={<HistoryOutlined />} 
            onClick={() => go("/driver/orders")}
          >
            {t?.history || "Tarix"}
          </Button>
          <Button 
            type="text" 
            block 
            style={{ textAlign: "left", height: 45, fontSize: 16 }} 
            icon={<SettingOutlined />} 
            onClick={() => go("/settings")}
          >
            {t?.settings || "Sozlamalar"}
          </Button>
          <Divider />
          <Button 
            type="text" 
            danger 
            block 
            style={{ textAlign: "left", height: 45, fontSize: 16 }} 
            icon={<LogoutOutlined />} 
            onClick={onLogout}
          >
            {t?.logout || "Chiqish"}
          </Button>
        </Drawer>

      </div>
    </DriverOnlineProvider>
  );
}