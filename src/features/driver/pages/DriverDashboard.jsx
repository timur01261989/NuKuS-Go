import React, { useEffect, useState } from "react";
import { Button, Card, Drawer, Space, Typography, Divider } from "antd";
import {
  MenuOutlined,
  CarOutlined,
  EnvironmentOutlined,
  RocketOutlined,
  SettingOutlined,
  HistoryOutlined,
  CustomerServiceOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { supabase } from "@lib/supabase";
import { useLanguage } from "@shared/i18n/useLanguage";

const { Title, Text } = Typography;

function initials(name) {
  const s = String(name || "").trim();
  if (!s) return "D";
  const parts = s.split(/\s+/).slice(0, 2);
  return parts.map(p => p[0]?.toUpperCase()).join("") || "D";
}

export default function DriverDashboard() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profile, setProfile] = useState({ fullName: "", avatarUrl: "" });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: u } = await supabase.auth.getUser();
        const user = u?.user;
        if (!user) return;
        let fullName = user.user_metadata?.full_name || user.user_metadata?.name || "";
        let avatarUrl = user.user_metadata?.avatar_url || "";
        try {
          const { data: p } = await supabase.from("profiles").select("full_name, avatar_url").eq("id", user.id).single();
          if (p?.full_name) fullName = p.full_name;
          if (p?.avatar_url) avatarUrl = p.avatar_url;
        } catch {}
        if (mounted) setProfile({ fullName: fullName || "Haydovchi", avatarUrl });
      } catch {}
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#f5f6f8" }}>
      <div style={{
        height: 56,
        display: "flex",
        alignItems: "center",
        padding: "0 14px",
        background: "#111",
        color: "white",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}>
        <Button type="text" onClick={() => setDrawerOpen(true)} icon={<MenuOutlined style={{ color: "white", fontSize: 20 }} />} />
        <div style={{ flex: 1, textAlign: "center", fontWeight: 900 }}>
          {t?.driver || "Haydovchi"}
        </div>
        <div style={{ width: 40 }} />
      </div>

      <div style={{ padding: 14, maxWidth: 560, margin: "0 auto" }}>
        <Title level={4} style={{ marginTop: 10, marginBottom: 12 }}>
          {t?.chooseService || "Xizmat turini tanlang"}
        </Title>

        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          <Card hoverable style={{ borderRadius: 16 }} onClick={() => navigate("/driver/taxi")}>
            <Space>
              <CarOutlined />
              <div>
                <Text strong>{t?.cityTaxi || "Shahar ichida taksi"}</Text><br/>
                <Text type="secondary">{t?.ordersInThisSection || "Buyurtmalar shu bo‘limda chiqadi"}</Text>
              </div>
            </Space>
          </Card>

          <Card hoverable style={{ borderRadius: 16 }} onClick={() => navigate("/driver/inter-provincial")}>
            <Space>
              <EnvironmentOutlined />
              <div>
                <Text strong>{t?.interProv || "Viloyatlar aro"}</Text><br/>
                <Text type="secondary">{t?.ordersInThisSection || "Buyurtmalar shu bo‘limda chiqadi"}</Text>
              </div>
            </Space>
          </Card>

          <Card hoverable style={{ borderRadius: 16 }} onClick={() => navigate("/driver/inter-district")}>
            <Space>
              <RocketOutlined />
              <div>
                <Text strong>{t?.interDistrict || "Tumanlar aro"}</Text><br/>
                <Text type="secondary">{t?.ordersInThisSection || "Buyurtmalar shu bo‘limda chiqadi"}</Text>
              </div>
            </Space>
          </Card>

          <Card hoverable style={{ borderRadius: 16 }} onClick={() => navigate("/driver/freight")}>
            <Space>
              <RocketOutlined />
              <div>
                <Text strong>{t?.freight || "Yuk tashish"}</Text><br/>
                <Text type="secondary">{t?.ordersInThisSection || "Buyurtmalar shu bo‘limda chiqadi"}</Text>
              </div>
            </Space>
          </Card>

          <Card hoverable style={{ borderRadius: 16 }} onClick={() => navigate("/driver/delivery")}>
            <Space>
              <RocketOutlined />
              <div>
                <Text strong>{t?.delivery || "Eltish xizmati"}</Text><br/>
                <Text type="secondary">{t?.ordersInThisSection || "Buyurtmalar shu bo‘limda chiqadi"}</Text>
              </div>
            </Space>
          </Card>
        </Space>
      </div>

      <Drawer placement="left" open={drawerOpen} onClose={() => setDrawerOpen(false)} width={300} bodyStyle={{ padding: 0 }}>
        <div style={{ padding: 16, background: "#111", color: "white" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: "#FFD700", display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 900, color: "#111"
            }}>
              {profile.avatarUrl ? <img alt="avatar" src={profile.avatarUrl} style={{ width: "100%", height: "100%", borderRadius: 12, objectFit: "cover" }} /> : initials(profile.fullName)}
            </div>
            <div>
              <div style={{ fontWeight: 900 }}>{profile.fullName || "Haydovchi"}</div>
              <div style={{ opacity: 0.85, fontSize: 12 }}>{t?.driver || "Haydovchi"}</div>
            </div>
          </div>
        </div>

        <div style={{ padding: 12, position: "relative", minHeight: "calc(100vh - 80px)" }}>
          <Button block icon={<SettingOutlined />} style={{ height: 44, borderRadius: 12, textAlign: "left" }} onClick={() => { setDrawerOpen(false); navigate("/settings"); }}>
            {t?.settings || "Sozlamalar"}
          </Button>

          <Button block icon={<HistoryOutlined />} style={{ height: 44, borderRadius: 12, textAlign: "left", marginTop: 8 }} onClick={() => { setDrawerOpen(false); navigate("/driver/orders"); }}>
            {t?.orderHistoryDriver || "Buyurtmalar tarixi"}
          </Button>

          <Divider style={{ margin: "12px 0" }} />

          <div style={{ position: "absolute", left: 12, right: 12, bottom: 12 }}>
            <Button block icon={<CustomerServiceOutlined />} style={{ height: 44, borderRadius: 12, textAlign: "left" }} onClick={() => { setDrawerOpen(false); navigate("/support"); }}>
              {t?.support || "Qo‘llab-quvvatlash"}
            </Button>

            <Button danger block icon={<LogoutOutlined />} style={{ height: 44, borderRadius: 12, textAlign: "left", marginTop: 8 }} onClick={() => { setDrawerOpen(false); navigate("/logout"); }}>
              {t?.logout || "Chiqish"}
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
