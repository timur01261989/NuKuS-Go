import React, { memo, useCallback, useMemo } from "react";
import { Card, Typography, Button, Space } from "antd";
import { SendOutlined, PhoneOutlined } from "@ant-design/icons";
import { supportAssets } from "@/assets/support";
import { orderAssets } from "@/assets/order";
import { assetStyles } from "@/assets/assetPolish";
import { realtimeAssets } from "@/assets/realtime";
import { essentialsAssets } from "@/assets/essentials";
import { usePageI18n } from "./pageI18n";
import { supportEntryPoints, buildSupportSurface } from "@/modules/client/features/support/supportExperienceGuidance.js";

const { Title, Text } = Typography;

/**
 * @file Support.jsx
 * @description UniGo Super App - Centralized Support Component with Fixed Icon Imports
 * @version 1.1.1
 * @author Senior Full-Stack Architect
 */

const essentialsSupportLinks = [
  {
    key: "report",
    title: "Hisobot va ticket",
    description: "Muammo, video report va hujjatli murojaatlarni tez yuborish",
    icon: essentialsAssets.support.supportReports,
    accent: "#fff7ed",
  },
  {
    key: "bug",
    title: "Xatolik bildirish",
    description: "Bug va noqulay holatlarni alohida kanal bilan yuborish",
    icon: essentialsAssets.support.supportBugLight,
    accent: "#fdf2f8",
  },
  {
    key: "profile",
    title: "Profil va tekshiruv",
    description: "Akkount, verification va reward bilan bog‘liq savollar",
    icon: essentialsAssets.auth.authUserpic,
    accent: "#eff6ff",
  },
];

const supportQuickLinks = [
  {
    key: "status",
    title: "Buyurtma holati",
    description: "Status, jadval va ogohlantirishlarni tez ko‘rish",
    icon: realtimeAssets.status.statusScheduleCheck || orderAssets.history.orderSchedule,
    accent: "#eff6ff",
  },
  {
    key: "receipt",
    title: "Chek va to‘lov",
    description: "Buyurtma kvitansiyasi va to‘lov ma’lumotlari",
    icon: realtimeAssets.notifications.notifyFeedIcon || orderAssets.history.orderReceiptFill || orderAssets.history.orderReceipt,
    accent: "#f5f3ff",
  },
  {
    key: "chat",
    title: "Chat va biriktirma",
    description: "Joylashuv, media va safar bo‘yicha xabar yuborish",
    icon: realtimeAssets.chat.chatAttachmentLocation || orderAssets.chat.chatAttachmentLocation,
    accent: "#ecfeff",
  },
];

const supportServiceHighlights = [
  { key: "support", label: "Yordam", icon: realtimeAssets.support.supportMain || supportAssets.services.support },
  {
    key: "station",
    label: "Stansiya",
    icon: orderAssets.services.serviceStationStore || supportAssets.services.stationLive || supportAssets.services.station,
  },
  {
    key: "tracking",
    label: "Tracking",
    icon: realtimeAssets.navigation.trackingProgressPin || orderAssets.courier.orderProgressPin,
  },
  {
    key: "courier",
    label: "Kuryer",
    icon: realtimeAssets.markers.markerRideDriver || orderAssets.tracking.courierDeliScooter,
  },
];

const Support = memo(() => {
  const { t, tx } = usePageI18n();
  const supportSurface = useMemo(() => buildSupportSurface({ unread: 2, hasOpenTicket: true }), []);

  const contactCards = useMemo(
    () => [
      {
        key: "telegram",
        title: "Telegram bot",
        description: "Tezkor savol-javoblar va texnik yordam",
        buttonText: "Bog'lanish",
        icon: realtimeAssets.chat.chatSupportLink || supportAssets.support.linkLive || supportAssets.support.link,
        buttonProps: {
          type: "primary",
          icon: <SendOutlined style={{ transform: "rotate(-45deg)" }} />,
          style: { backgroundColor: "#0088cc", borderColor: "#0088cc" },
        },
      },
      {
        key: "phone",
        title: "Call-markaz",
        description: "Operator bilan bevosita suhbatlashish",
        buttonText: "Qo'ng'iroq",
        icon: realtimeAssets.support.supportCallQuick || orderAssets.chat.chatSupportPhone || supportAssets.support.phoneLive || supportAssets.support.phone,
        buttonProps: {
          type: "default",
          icon: <PhoneOutlined />,
        },
      },
    ],
    []
  );

  const handleContact = useCallback((type) => {
    switch (type) {
      case "telegram":
        window.open("https://t.me/unigo_support", "_blank");
        break;
      case "phone":
        window.location.href = "tel:+998000000000";
        break;
      default:
        console.warn("Unsupported support channel triggered.");
    }
  }, []);

  return (
    <div
      className="unigo-support-page"
      style={{
        padding: "24px 16px",
        maxWidth: 720,
        margin: "0 auto",
        minHeight: "100vh",
      }}
    >
      <header style={{ marginBottom: 32, textAlign: "center" }}>
        <img
          src={realtimeAssets.support.supportCallChat || supportAssets.support.mainPlus || supportAssets.support.mainAlt || supportAssets.support.main}
          alt="support"
          style={{ ...assetStyles.supportHero, marginBottom: 20 }}
        />
        <Title level={3} style={{ marginTop: 0, fontWeight: 700 }}>
          {t.supportTitle || tx("supportSection", "Yordam markazi")}
        </Title>
        <Text type="secondary" style={{ fontSize: 16 }}>
          {t.supportHint || tx("supportHintLocal", "UniGo jamoasi sizga xizmat ko'rsatishdan mamnun.")}
        </Text>
      </header>

      <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
        {supportServiceHighlights.map((item) => (
          <Space key={item.key} size={8}>
            <img src={item.icon} alt="" style={assetStyles.supportChannel} />
            <Text type="secondary">{item.label}</Text>
          </Space>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          gap: 12,
          marginBottom: 24,
        }}
      >
        {supportQuickLinks.map((item) => (
          <Card
            key={item.key}
            size="small"
            style={{
              borderRadius: 18,
              border: "1px solid rgba(15,23,42,0.08)",
              background: `linear-gradient(135deg, ${item.accent} 0%, #ffffff 100%)`,
            }}
            styles={{ body: { padding: 16 } }}
          >
            <Space align="start" size={12}>
              <span
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 14,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#ffffff",
                  boxShadow: "0 8px 20px rgba(15,23,42,0.08)",
                  flex: "0 0 auto",
                }}
              >
                <img src={item.icon} alt="" style={{ width: 22, height: 22, objectFit: "contain" }} />
              </span>
              <span>
                <Text strong style={{ display: "block", marginBottom: 4 }}>
                  {item.title}
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {item.description}
                </Text>
              </span>
            </Space>
          </Card>
        ))}
      </div>

      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        {contactCards.map((card) => (
          <Card
            key={card.key}
            hoverable
            style={{ borderRadius: 16, border: "1px solid #f0f0f0", overflow: "hidden" }}
            styles={{ body: { padding: 24 } }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
              <div style={{ flex: "1 1 200px" }}>
                <Space size={12}>
                  <img src={card.icon} alt={card.title} style={assetStyles.supportChannel} />
                  <Title level={5} style={{ margin: 0 }}>
                    {card.title}
                  </Title>
                </Space>
                <Text type="secondary">{card.description}</Text>
              </div>
              <Button
                size="large"
                shape="round"
                onClick={() => handleContact(card.key)}
                {...card.buttonProps}
              >
                {card.buttonText}
              </Button>
            </div>
          </Card>
        ))}


        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {essentialsSupportLinks.map((item) => (
            <Card key={item.key} style={{ borderRadius: 16, backgroundColor: item.accent, border: "none" }}>
              <Space align="start" size={12}>
                <img src={item.icon} alt="" style={assetStyles.chatAction} />
                <Space direction="vertical" size={3}>
                  <Text strong>{item.title}</Text>
                  <Text type="secondary">{item.description}</Text>
                </Space>
              </Space>
            </Card>
          ))}
        </div>

        <Card style={{ borderRadius: 16, backgroundColor: "#f9f9f9", border: "none" }}>
          <Space direction="vertical" size={4}>
            <Text strong style={{ color: "#595959" }}>
              {tx("workingHours", "Ish tartibi:")}
            </Text>
            <Text type="secondary">Dushanba — Yakshanba: 08:00 dan 22:00 gacha</Text>
            <Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: "block" }}>
              * Bayram kunlari ish vaqti o'zgarishi mumkin.
            </Text>
          </Space>
        </Card>
      </Space>
    </div>
  );
});

Support.displayName = "Support";

export default Support;
