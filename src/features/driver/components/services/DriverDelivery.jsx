// Bridge wrapper: eski DriverHome/DriverOrderFeed ichidagi "Delivery" bo'limini ishlatish uchun.
// Bu yerda alohida "delivery" haydovchi sahifasi yo'q edi, shuning uchun
// shared delivery-integration modulidan UnifiedParcelFeed ni sahifa ko'rinishida chiqaramiz.

import React, { useMemo } from "react";
import { Card, Typography } from "antd";
import { supabase } from "@/lib/supabase";
import {
  IntegrationProvider,
  UnifiedParcelFeed,
  configureIntegrationApi,
} from "../../delivery-integration";

const { Title, Text } = Typography;

export default function DriverDelivery() {
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
        <Title level={4} style={{ margin: 0 }}>
          Eltish (Pochta) integratsiyasi
        </Title>
        <Text type="secondary">
          Bu bo'lim shahar/viloyat safarlari bilan birga yuk (posilka) olish uchun.
        </Text>
      </Card>

      <IntegrationProvider>
        <UnifiedParcelFeed driverId={driverId} driverMode="CITY" supabase={supabase} />
      </IntegrationProvider>
    </div>
  );
}
