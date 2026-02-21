import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, Drawer, Space, Typography, Divider } from "antd";
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
import { useNavigate } from "react-router-dom";
import { supabase } from "@lib/supabase";
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
          const { data: p } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("id", user.id)
            .single();

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
        <div
          style={{
            padding: 16,
            background: "var(--card-bg-strong)",
            color: "var(--card-text)",
            borderBottom: "1px solid var(--card-border)",
          }}
        >
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: "var(--brand)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                color: "#111",
                overflow: "hidden",
              }}
            >
              {profile.avatarUrl ? (
                <img
                  alt="avatar"
                  src={profile.avatarUrl}
                  style={{ width: "100%", height: "100%", borderRadius: 12, objectFit: "cover" }}
                />
              ) : (
                initials(profile.fullName)
              )}
            </div>

            <div>
              <div style={{ fontWeight: 900 }}>{profile.fullName || "Foydalanuvchi"}</div>
              <div style={{ opacity: 0.85, fontSize: 12 }}>{t?.client || "Yolovchi"}</div>
            </div>
          </div>
        </div>

        <div style={{ padding: 12, position: "relative", minHeight: "calc(100vh - 80px)" }}>
          <Button
            block
            icon={<UserOutlined />}
            style={{ height: 44, borderRadius: 12, textAlign: "left" }}
            onClick={() => {
              close();
              navigate("/driver-mode");
            }}
          >
            {t?.workAsDriver || "Haydovchi bo‘lib ishlash"}
          </Button>

          <Divider style={{ margin: "12px 0" }} />

          <Button
            block
            icon={<EnvironmentOutlined />}
            style={{ height: 44, borderRadius: 12, textAlign: "left" }}
            onClick={() => {
              close();
              navigate("/addresses");
            }}
          >
            {t?.myAddresses || "Mening manzillarim"}
          </Button>

          <Button
            block
            icon={<SettingOutlined />}
            style={{ height: 44, borderRadius: 12, textAlign: "left", marginTop: 8 }}
            onClick={() => {
              close();
              navigate("/settings");
            }}
          >
            {t?.settings || "Sozlamalar"}
          </Button>

          <Button
            block
            icon={<HistoryOutlined />}
            style={{ height: 44, borderRadius: 12, textAlign: "left", marginTop: 8 }}
            onClick={() => {
              close();
              navigate("/orders");
            }}
          >
            {t?.orderHistory || "Buyurtmalar tarixi"}
          </Button>

          <div style={{ position: "absolute", left: 12, right: 12, bottom: 12 }}>
            <Button
              block
              icon={<CustomerServiceOutlined />}
              style={{ height: 44, borderRadius: 12, textAlign: "left" }}
              onClick={() => {
                close();
                navigate("/support");
              }}
            >
              {t?.support || "Qo‘llab-quvvatlash"}
            </Button>

            <Button
              danger
              block
              icon={<LogoutOutlined />}
              style={{ height: 44, borderRadius: 12, textAlign: "left", marginTop: 8 }}
              onClick={() => {
                close();
                navigate("/logout");
              }}
            >
              {t?.logout || "Chiqish"}
            </Button>
          </div>
        </div>
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
