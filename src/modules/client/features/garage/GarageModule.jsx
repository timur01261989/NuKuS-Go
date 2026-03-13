import React from "react";
import { Card, Button, Space, Typography } from "antd";
import { useLanguage } from "@/shared/i18n/useLanguage";

const { Text } = Typography;

export function GarageModule() {
  const { tr } = useLanguage();
  return (
    <div style={{ padding: 12 }}>
      <Card title={tr("garage.title", "Garage")} style={{ borderRadius: 16 }}>
        <Text type="secondary">{tr("garage.subtitle", "Haydovchi mashinalari, hujjatlar, status")}</Text>
        <div style={{ marginTop: 10 }}>
          <Text>{tr("garage.scaffold", "Bu modul tayyor scaffold. Keyin DB bilan ulaysiz.")}</Text>
        </div>

        <Space style={{ marginTop: 12 }}>
          <Button type="primary">{tr("garage.addCar", "+ Mashina qo‘shish")}</Button>
          <Button>{tr("garage.documents", "Hujjatlar")}</Button>
        </Space>
      </Card>
    </div>
  );
}
