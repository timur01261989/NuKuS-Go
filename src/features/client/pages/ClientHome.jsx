import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, Drawer, Space, Typography, Divider } from "antd";
import UniGoSidebar from "@/components/UniGoSidebar";
import {
  MenuOutlined,
  CarOutlined,
  EnvironmentOutlined,
  RocketOutlined,
  ShopOutlined,
  SettingOutlined,
  HistoryOutlined,
  CustomerServiceOutlined,
  LogoutOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { listMarketCars, formatPriceUZS } from "@services/marketService";
import { useLanguage } from "@shared/i18n/useLanguage";
import { haversineKm } from "../shared/geo/haversine";
import { nominatimReverse as _nominatimReverse } from "../shared/geo/nominatim";

const { Title, Text } = Typography;

function initials(name) {
  const s = String(name || "").trim();
  if (!s) return "U";
  const parts = s.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("") || "U";
}

export default function ClientHome() {
  const navigate = useNavigate();
  const location = useLocation(); // YANGI - driver mode ga kelayotganda state o'tish
  const { t } = useLanguage();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profile, setProfile] = useState({ fullName: "", avatarUrl: "" });
  const [cars, setCars] = useState([]);

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
          // Be resilient: some schemas don't have is_admin; some use user_id instead of id.
          let pRes = await supabase
            .from("profiles")
            .select("full_name,avatar_url,role")
            .eq("id", user.id)
            .maybeSingle();

          // Fallback: some schemas use profiles.user_id instead of profiles.id
          if (pRes.error && /column\s+\"id\"\s+does\s+not\s+exist/i.test(pRes.error.message || "")) {
            pRes = await supabase
              .from("profiles")
              .select("full_name,avatar_url,role")
              .eq("user_id", user.id)
              .maybeSingle();
          }

          const p = pRes.data;

          if (p?.full_name) fullName = p.full_name;
          if (p?.avatar_url) avatarUrl = p.avatar_url;
        } catch {}

        if (mounted) setProfile({ fullName: fullName || "Foydalanuvchi", avatarUrl });
      } catch {}
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await listMarketCars({ limit: 6 });
        if (mounted) setCars(Array.isArray(list) ? list : []);
      } catch {
        if (mounted) setCars([]);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const open = () => setDrawerOpen(true);
  const close = () => setDrawerOpen(false);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-layout)",
        color: "var(--text)",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          height: 56,
          display: "flex",
          alignItems: "center",
          padding: "0 14px",
          background: "var(--card-bg-strong)",
          borderBottom: "1px solid var(--card-border)",
          color: "var(--card-text)",
          position: "sticky",
          top: 0,
          zIndex: 10,
          backdropFilter: "blur(10px)",
        }}
      >
        <Button
          type="text"
          onClick={open}
          icon={<MenuOutlined style={{ color: "var(--card-text)", fontSize: 20 }} />}
        />
        <div style={{ flex: 1, textAlign: "center", fontWeight: 900 }}>
          {t?.appName || "Nukus Go"}
        </div>
        <div style={{ width: 40 }} />
      </div>

      <div style={{ padding: 14, maxWidth: 560, margin: "0 auto" }}>
        <Title level={4} style={{ marginTop: 10, marginBottom: 12, color: "var(--text)" }}>
          {t?.whereTo || "Qayerga boramiz?"}
        </Title>

        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          <Card hoverable style={{ borderRadius: 16 }} onClick={() => navigate("/client/taxi")}>
            <Space>
              <CarOutlined />
              <div>
                <Text strong>{t?.cityTaxi || "Shahar ichida taksi"}</Text>
                <br />
                <Text type="secondary">{t?.cityTaxiHint || "Tez buyurtma"}</Text>
              </div>
            </Space>
          </Card>

          <Card
            hoverable
            style={{ borderRadius: 16 }}
            onClick={() => navigate("/client/inter-provincial")}
          >
            <Space>
              <EnvironmentOutlined />
              <div>
                <Text strong>{t?.interProv || "Viloyatlar aro"}</Text>
                <br />
                <Text type="secondary">{t?.interProvHint || "Shaharlar o‘rtasi"}</Text>
              </div>
            </Space>
          </Card>

          <Card
            hoverable
            style={{ borderRadius: 16 }}
            onClick={() => navigate("/client/inter-district")}
          >
            <Space>
              <RocketOutlined />
              <div>
                <Text strong>{t?.interDistrict || "Tumanlar aro"}</Text>
                <br />
                <Text type="secondary">{t?.interDistrictHint || "Tumanlar o‘rtasi"}</Text>
              </div>
            </Space>
          </Card>

          <Card hoverable style={{ borderRadius: 16 }} onClick={() => navigate("/client/freight")}>
            <Space>
              <RocketOutlined />
              <div>
                <Text strong>{t?.freight || "Yuk tashish"}</Text>
                <br />
                <Text type="secondary">{t?.freightHint || "Yuk xizmatlari"}</Text>
              </div>
            </Space>
          </Card>

          <Card hoverable style={{ borderRadius: 16 }} onClick={() => navigate("/client/delivery")}>
            <Space>
              <RocketOutlined />
              <div>
                <Text strong>{t?.delivery || "Eltish xizmati"}</Text>
                <br />
                <Text type="secondary">{t?.deliveryHint || "Yetkazib berish"}</Text>
              </div>
            </Space>
          </Card>

          <Button
            type="primary"
            block
            icon={<ShopOutlined />}
            style={{
              height: 50,
              borderRadius: 14,
              fontWeight: 900,
            }}
            onClick={() => navigate("/auto-market")}
          >
            {t?.autoMarket || "Avto savdo"}
          </Button>
        </Space>

        {/* Ads slots */}
        <div style={{ marginTop: 16 }}>
          <AdSlot title={t?.adSlot || "Reklama (admin joyi)"} />
        </div>

        {/* New cars preview */}
        <div style={{ marginTop: 14 }}>
          <Title level={5} style={{ marginBottom: 10, color: "var(--text)" }}>
            {t?.newCars || "Yangi qo‘shilgan mashinalar"}
          </Title>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {(cars.length ? cars : Array.from({ length: 4 }).map((_, i) => ({ id: "p" + i }))).map(
              (c, i) => (
                <Card
                  key={c.id || i}
                  hoverable
                  style={{ borderRadius: 16 }}
                  onClick={() => navigate("/auto-market")}
                >
                  <div
                    style={{
                      height: 90,
                      borderRadius: 12,
                      background: "var(--field-bg)",
                      border: "1px solid var(--field-border)",
                    }}
                  />
                  <div style={{ marginTop: 8, fontWeight: 900 }}>
                    {c.title || c.model || `Mashina ${i + 1}`}
                  </div>
                  <Text type="secondary">{c.price ? formatPriceUZS(c.price) : " "}</Text>
                </Card>
              )
            )}
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <AdSlot title={t?.adSlot || "Reklama (admin joyi)"} />
        </div>
      </div>

      {/* Sidebar */}
      <Drawer
        placement="left"
        open={drawerOpen}
        onClose={close}
        width={300}
        bodyStyle={{ padding: 0 }}
      >
        <UniGoSidebar onClose={() => setDrawerOpen(false)} />
      </Drawer>
    </div>
  );
}

function AdSlot({ title }) {
  return (
    <Card style={{ borderRadius: 16 }}>
      <Text type="secondary">{title}</Text>
      <div
        style={{
          height: 90,
          borderRadius: 12,
          background: "var(--field-bg)",
          border: "1px solid var(--field-border)",
          marginTop: 10,
        }}
      />
    </Card>
  );
}