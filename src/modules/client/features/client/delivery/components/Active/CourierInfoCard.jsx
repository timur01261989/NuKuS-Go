import React, { useMemo } from "react";
import { Avatar, Card, Typography, Space, Tag } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { orderAssets } from "@/assets/order";
import { realtimeAssets } from "@/assets/realtime";

const { Text } = Typography;

function resolveCourierVisual(courier) {
  const vehicle = String(courier?.vehicle || courier?.transport || courier?.mode || "").toLowerCase();
  if (vehicle.includes("bike") || vehicle.includes("bicycle")) return realtimeAssets.markers.markerRideDriver || orderAssets.tracking.courierDeliBicycle;
  if (vehicle.includes("foot") || vehicle.includes("walk")) return realtimeAssets.markers.markerUserDriver || orderAssets.tracking.courierDeliFeet;
  if (vehicle.includes("moto") || vehicle.includes("motor")) return realtimeAssets.markers.markerDriverFix || orderAssets.tracking.courierDeliMoto;
  if (vehicle.includes("car") || vehicle.includes("auto")) return realtimeAssets.markers.markerDriver || orderAssets.tracking.courierDeliCar;
  return realtimeAssets.markers.markerSearchCar || orderAssets.tracking.courierDeliScooter || orderAssets.courier.orderDelivery;
}

function resolveCourierTier(rating) {
  const value = Number(rating || 0);
  if (value >= 4.9) return realtimeAssets.markers.badgeMedalTop || realtimeAssets.markers.tierPlatinum;
  if (value >= 4.8) return realtimeAssets.markers.badgeMedalPro || realtimeAssets.markers.tierGold;
  if (value >= 4.6) return realtimeAssets.markers.badgeMedalExpert || realtimeAssets.markers.tierSilver;
  return realtimeAssets.markers.badgeMedalNew || realtimeAssets.markers.tierBronze;
}

export default function CourierInfoCard({ courier }) {
  const courierVisual = useMemo(() => resolveCourierVisual(courier), [courier]);
  const courierTier = useMemo(() => resolveCourierTier(courier?.rating), [courier?.rating]);

  if (!courier) return null;
  return (
    <Card style={{ borderRadius: 18, border: "1px solid rgba(15,23,42,0.06)" }} bodyStyle={{ padding: 14 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <Avatar size={48} src={courier.avatar} icon={<UserOutlined />} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <div style={{ fontWeight: 1000 }}>{courier.name || "Kuryer"}</div>
            <Tag color="blue" style={{ borderRadius: 999 }}>Yetkazishda</Tag>
          </div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {courier.vehicle || "Transport"} • {courier.phone || ""}
          </Text>
          <Space size={8} style={{ marginTop: 8, flexWrap: "wrap" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 10px",
                borderRadius: 999,
                background: "#f8fafc",
              }}
            >
              <img src={courierVisual} alt="" style={{ width: 18, height: 18, objectFit: "contain" }} />
              <span style={{ fontSize: 12, fontWeight: 700 }}>Live tracking</span>
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 10px",
                borderRadius: 999,
                background: "#fff7ed",
              }}
            >
              <img src={courierTier} alt="" style={{ width: 18, height: 18, objectFit: "contain" }} />
              <span style={{ fontSize: 12, fontWeight: 700 }}>Faol kuryer</span>
            </span>
          </Space>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: 900, fontSize: 12, opacity: 0.7 }}>Reyting</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end", marginTop: 4 }}>
            <img src={orderAssets.chat.chatRatingStars} alt="" style={{ width: 40, height: 10, objectFit: "contain" }} />
            <span style={{ fontWeight: 800 }}>{courier.rating || "—"}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
