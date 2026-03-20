// Market driver wrapper: UI-da "Market" servisini ko'rsatish uchun.
// Prinsip o'zgarmaydi: hozircha Delivery integratsiya feed'i qayta ishlatiladi.
// Agar keyin backendda market order pipeline bo'lsa, shu fayl ichida filter/service key qo'shiladi.

import React, { useMemo } from "react";
import { Button, Card, Typography } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import {
  IntegrationProvider,
  UnifiedParcelFeed,
  configureIntegrationApi,
} from "../../delivery-integration";

const { Title, Text } = Typography;

export default function DriverMarket({ onBack }) {
  const driverId = useMemo(() => {
    return (
      localStorage.getItem("driverUserId") ||
      localStorage.getItem("userId") ||
      ""
    );
  }, []);

  useMemo(() => {
    const base = (import.meta?.env?.VITE_API_BASE || "").replace(/\/$/, "");
    configureIntegrationApi({ baseUrl: base });
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 12 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={onBack} />
      </div>
      <Card style={{ borderRadius: 16, marginBottom: 12 }} styles={{ body: { padding: 14 } }}>
        <Title level={4} style={{ margin: 0 }}>Market buyurtmalari</Title>
        <Text type="secondary">
          Hozircha umumiy yetkazib berish feed'i ishlatiladi (backend market feed tayyor bo'lsa, shu yerda ajratiladi).
        </Text>
      </Card>

      <IntegrationProvider driverId={driverId}>
        <UnifiedParcelFeed />
      </IntegrationProvider>
    </div>
  );
}
