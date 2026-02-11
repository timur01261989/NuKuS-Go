import React from "react";
import { Card, Button, Space, Typography } from "antd";

const { Text } = Typography;

export function GarageModule() {
  return (
    <div style={{ padding: 12 }}>
      <Card title="Garage" style={{ borderRadius: 16 }}>
        <Text type="secondary">Haydovchi mashinalari, hujjatlar, status</Text>
        <div style={{ marginTop: 10 }}>
          <Text>Bu modul tayyor scaffold. Keyin DB bilan ulaysiz.</Text>
        </div>

        <Space style={{ marginTop: 12 }}>
          <Button type="primary">+ Mashina qo‘shish</Button>
          <Button>Hujjatlar</Button>
        </Space>
      </Card>
    </div>
  );
}
