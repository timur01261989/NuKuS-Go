// Market driver wrapper: UI-da "Market" servisini ko'rsatish uchun.
// Prinsip o'zgarmaydi: hozircha Delivery integratsiya feed'i qayta ishlatiladi.
// Agar keyin backendda market order pipeline bo'lsa, shu fayl ichida filter/service key qo'shiladi.

import React, { useMemo } from "react";
import { Card, Typography } from "antd";
import {
  IntegrationProvider,
  UnifiedParcelFeed,
  configureIntegrationApi,
} from "../../delivery-integration";

const { Title, Text } = Typography;

export default function DriverMarket() {
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
      <Card style={{ borderRadius: 16, marginBottom: 12 }} bodyStyle={{ padding: 14 }}>
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
