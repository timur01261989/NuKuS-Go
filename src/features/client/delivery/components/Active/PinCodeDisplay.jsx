import React from "react";
import { Card, Typography } from "antd";
const { Text } = Typography;

export default function PinCodeDisplay({ code }) {
  if (!code) return null;
  return (
    <Card style={{ borderRadius: 18, background: "rgba(255,255,255,.96)" }} bodyStyle={{ padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div>
          <div style={{ fontWeight: 1000 }}>Maxfiy kod</div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Kuryer yetib borganda kodni ayting (begonaga bermaslik uchun)
          </Text>
        </div>
        <div style={{ fontSize: 22, fontWeight: 1100, letterSpacing: 2 }}>{code}</div>
      </div>
    </Card>
  );
}
