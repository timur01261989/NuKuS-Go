import React from "react";
import { Button, Card, Drawer, Typography, Divider, Switch as AntSwitch, message, Avatar } from "antd";
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
import { supabase } from "@/services/supabase/supabaseClient.js";
import { startTracking } from "../components/services/locationService";

const { Title, Text } = Typography;

export function initials(name) {
  const s = String(name || "").trim();
  if (!s) return "D";
  const parts = s.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("") || "D";
}

export async function loadLegacyDriverDashboardProfile({ onUnauthed }) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    onUnauthed?.();
    return null;
  }

  const [profileRes, appRes, presenceRes] = await Promise.all([
    supabase.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle(),
    supabase
      .from("driver_applications")
      .select("first_name, last_name, phone")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("driver_presence").select("is_online").eq("driver_id", user.id).maybeSingle(),
  ]);

  if (profileRes.error) console.error("Profile yuklashda xato:", profileRes.error);
  if (appRes.error) console.error("Driver application yuklashda xato:", appRes.error);
  if (presenceRes.error) console.error("Driver presence yuklashda xato:", presenceRes.error);

  const profileData = profileRes.data || {};
  const appData = appRes.data || {};
  const presenceData = presenceRes.data || {};

  const fullName = String(
    profileData.full_name || `${appData.first_name || ""} ${appData.last_name || ""}`.trim()
  ).trim();

  return {
    fullName,
    phone: profileData.phone || appData.phone || "",
    avatarUrl: "",
    onlineStatus: presenceData.is_online === true,
    userId: user.id,
  };
}

export async function toggleDriverPresence({ checked, setLoading, setIsOnline, onError }) {
  setLoading(true);
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Foydalanuvchi topilmadi");

    const { error } = await supabase
      .from("driver_presence")
      .upsert(
        {
          driver_id: user.id,
          is_online: checked,
          updated_at: new Date().toISOString(),
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: "driver_id" }
      );

    if (error) throw error;

    setIsOnline(checked);
    localStorage.setItem("driverOnline", checked ? "1" : "0");

    if (checked) {
      message.success("Siz Online bo'ldingiz.");
      startTracking();
    } else {
      message.warning("Siz Offline bo'ldingiz.");
    }
    return true;
  } catch (err) {
    console.error("Xatolik:", err);
    message.error("Statusni o'zgartirishda xatolik!");
    setIsOnline(!checked);
    onError?.(err);
    return false;
  } finally {
    setLoading(false);
  }
}

export function LegacyDashboardHeader({ profile, onOpenMenu }) {
  return (
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
        <Avatar size={40} style={{ backgroundColor: "#1677ff" }} icon={<UserOutlined />} src={profile.avatarUrl}>
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

      <Button type="text" icon={<MenuOutlined style={{ fontSize: 20 }} />} onClick={onOpenMenu} />
    </div>
  );
}

export function LegacyDashboardStatusCard({ isOnline, loading, onToggle, t }) {
  return (
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
            onChange={onToggle}
            style={{ transform: "scale(1.2)" }}
          />
        </div>
      </Card>
    </div>
  );
}

export function LegacyDashboardPrimaryMenu({ t, go, onLogout }) {
  const buttonStyle = {
    height: 56,
    borderRadius: 16,
    marginBottom: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    fontSize: 16,
    fontWeight: 500,
  };

  return (
    <div style={{ padding: "0 16px" }}>
      <Button block icon={<HistoryOutlined />} style={buttonStyle} onClick={() => go("/driver/orders")}>
        {t?.orderHistoryDriver || "Buyurtmalar tarixi"}
      </Button>

      <Button block icon={<SettingOutlined />} style={buttonStyle} onClick={() => go("/driver/settings")}>
        {t?.settings || "Sozlamalar"}
      </Button>

      <Button block icon={<CustomerServiceOutlined />} style={buttonStyle} onClick={() => go("/support")}>
        {t?.support || "Qo‘llab-quvvatlash"}
      </Button>

      <Button
        block
        danger
        icon={<LogoutOutlined />}
        style={{ ...buttonStyle, marginBottom: 0, marginTop: 20 }}
        onClick={onLogout}
      >
        {t?.logout || "Chiqish"}
      </Button>
    </div>
  );
}

export function LegacyDashboardDrawer({ drawerOpen, onClose, profile, go }) {
  return (
    <Drawer title="Menu" placement="left" onClose={onClose} open={drawerOpen} width={280}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <Avatar size={64} icon={<UserOutlined />} src={profile.avatarUrl} style={{ marginBottom: 12 }} />
        <Title level={4} style={{ margin: 0 }}>
          {profile.fullName}
        </Title>
        <Text type="secondary">{profile.phone}</Text>
      </div>
      <Divider />
      <Button type="text" block style={{ textAlign: "left", height: 40 }} icon={<CarOutlined />} onClick={() => go("/driver/home")}>
        Asosiy
      </Button>
      <Button type="text" block style={{ textAlign: "left", height: 40 }} icon={<HistoryOutlined />} onClick={() => go("/driver/orders")}>
        Tarix
      </Button>
      <Button type="text" block style={{ textAlign: "left", height: 40 }} icon={<SettingOutlined />} onClick={() => go("/driver/settings")}>
        Sozlamalar
      </Button>
    </Drawer>
  );
}
