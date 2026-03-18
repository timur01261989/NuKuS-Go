import React from "react";
import { Card, Typography } from "antd";
import { orderAssets } from "@/assets/order";
const { Text } = Typography;

export default function PinCodeDisplay({ code }) {
  if (!code) return null;
  return (
    <Card style={{ borderRadius: 18, background: "rgba(255,255,255,.96)" }} styles={{ body: { padding: 14 } }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <img src={orderAssets.orderSupport || orderAssets.chatSupportPhone} alt="" style={{ width: 20, height: 20, objectFit: "contain", marginTop: 2 }} />
          <div>
            <div style={{ fontWeight: 1000 }}>Maxfiy kod</div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Kuryer yetib borganda kodni ayting (begonaga bermaslik uchun)
            </Text>
          </div>
        </div>
        <div style={{ fontSize: 22, fontWeight: 1100, letterSpacing: 2 }}>{code}</div>
      </div>
    </Card>
  );
}
