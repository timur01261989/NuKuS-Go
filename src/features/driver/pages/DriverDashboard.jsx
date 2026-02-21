import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  Drawer,
  Space,
  Typography,
  Divider,
  Switch,
  Tag,
  message,
  Avatar,
  Spin
} from "antd";
import {
  MenuOutlined,
  CarOutlined,
  EnvironmentOutlined,
  RocketOutlined,
  SettingOutlined,
  HistoryOutlined,
  CustomerServiceOutlined,
  LogoutOutlined,
  UserOutlined,
  CheckCircleOutlined,
  StopOutlined
} from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@lib/supabase";
import { useLanguage } from "../../../shared/i18n/useLanguage"; 
import { startTracking } from "../components/services/locationService";

const { Title, Text } = Typography;

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
  // STATE
  // =========================
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profile, setProfile] = useState({ fullName: "", avatarUrl: "", phone: "" });
  const [loading, setLoading] = useState(false); 
  
  const [isOnline, setIsOnline] = useState(() => {
    const v = localStorage.getItem("driverOnline");
    return v === "1";
  });

  // =========================
  // 1. MA'LUMOTLARNI YUKLASH
  // =========================
  useEffect(() => {
    let mounted = true;

    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate("/login");
          return;
        }

        // NOTE: drivers jadvalida turli sxema variantlari bor (approved/status va boshqalar).
        // Select("*") schema mismatch (PGRST204) xatolarini oldini oladi.
        const { data: driverData, error } = await supabase
          .from("drivers")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Profil yuklashda xato:", error);
          return;
        }

        if (!driverData) {
          // driver row yo'q bo'lsa registerga yuboramiz (oq ekran bo'lmasin)
          navigate("/driver/register", { replace: true });
          return;
        }

        if (mounted && driverData) {
          setProfile({
            fullName: `${driverData.first_name || ""} ${driverData.last_name || ""}`.trim(),
            phone: driverData.phone,
            avatarUrl: "",
          });

          const onlineStatus = driverData.is_online === true;
          setIsOnline(onlineStatus);
          localStorage.setItem("driverOnline", onlineStatus ? "1" : "0");

          if (onlineStatus) {
            startTracking();
          }
        }
      } catch (err) {
        console.error("Kutilmagan xato:", err);
      }
    };

    fetchProfile();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  // =========================
  // 2. ONLINE / OFFLINE TUGMASI (TUZATILDI)
  // =========================
  const toggleOnline = async (checked) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Foydalanuvchi topilmadi");

      // DIQQAT: Faqat 'is_online' va 'last_seen_at' o'zgaradi.
      // 'status' ustuniga tegmaymiz (u 'active' bo'lib qolishi shart).
      const { error } = await supabase
        .from("drivers")
        .update({ 
          is_online: checked,
          last_seen_at: new Date().toISOString() 
        })
        .eq("user_id", user.id);

      if (error) throw error;

      setIsOnline(checked);
      localStorage.setItem("driverOnline", checked ? "1" : "0");
      
      if (checked) {
        message.success("Siz Online bo'ldingiz.");
        startTracking(); 
      } else {
        message.warning("Siz Offline bo'ldingiz.");
      }

    } catch (err) {
      console.error("Xatolik:", err);
      message.error("Statusni o'zgartirishda xatolik!");
      setIsOnline(!checked); // Xato bo'lsa qaytarib qo'yamiz
    } finally {
      setLoading(false); 
    }
  };

  // =========================
  // 3. SAHIFA OTISH
  // =========================
  const go = (path) => {
    setDrawerOpen(false);
    navigate(path);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    navigate("/login");
  };

  // =========================
  // 4. RENDER
  // =========================
  return (
    <div style={{ background: "#f5f5f5", minHeight: "100vh", paddingBottom: 80 }}>
      {/* HEADER */}
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

      {/* STATUS KARTASI */}
      <div style={{ padding: 16 }}>
        <Card
          style={{
            borderRadius: 16,
            border: "none",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            background: isOnline ? "linear-gradient(135deg, #f6ffed 0%, #ffffff 100%)" : "#fff"
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
                  border: isOnline ? "1px solid #b7eb8f" : "1px solid #ffa39e"
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
                  {isOnline ? (t?.online || "Siz Onlaynsiz") : (t?.offline || "Siz Offlaynsiz")}
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {isOnline ? "Buyurtmalar qabul qilinmoqda" : "Hozir dam olish rejimi"}
                </Text>
              </div>
            </div>

            <Switch
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

      {/* MENYU TUGMALARI */}
      <div style={{ padding: "0 16px" }}>
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
            fontWeight: 500
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
            fontWeight: 500
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
            fontWeight: 500
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
            marginTop: 20
          }}
          onClick={handleLogout}
        >
          {t?.logout || "Chiqish"}
        </Button>
      </div>

      {/* DRAWER */}
      <Drawer
        title="Menu"
        placement="left"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        width={280}
      >
        <div style={{ textAlign: "center", marginBottom: 24 }}>
           <Avatar size={64} icon={<UserOutlined />} src={profile.avatarUrl} style={{ marginBottom: 12 }} />
           <Title level={4} style={{ margin: 0 }}>{profile.fullName}</Title>
           <Text type="secondary">{profile.phone}</Text>
        </div>
        <Divider />
        <Button type="text" block style={{ textAlign: "left", height: 40 }} icon={<CarOutlined />} onClick={() => go("/driver/home")}>
           Asosiy
        </Button>
        <Button type="text" block style={{ textAlign: "left", height: 40 }} icon={<HistoryOutlined />} onClick={() => go("/driver/orders")}>
           Tarix
        </Button>
        <Button type="text" block style={{ textAlign: "left", height: 40 }} icon={<SettingOutlined />} onClick={() => go("/settings")}>
           Sozlamalar
        </Button>
      </Drawer>
    </div>
  );
}