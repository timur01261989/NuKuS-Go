import React from "react";
import { Button, Card, Space, Typography } from "antd";
import { CompassOutlined } from "@ant-design/icons";
import { useLocationFeatures } from "../../hooks/useLocationFeatures";

const { Text } = Typography;

export default function NavigationLauncher({ latlng, label }) {
  const { openNav } = useLocationFeatures({ enabled: false });

  return (
    <Card style={{ borderRadius: 18 }}>
      <Space direction="vertical" size={8} style={{ width: "100%" }}>
        <Text strong>🚀 Navigatsiya</Text>
        <Text type="secondary">{label || "Manzil"}</Text>
        <Button type="primary" icon={<CompassOutlined />} onClick={() => openNav(latlng)} disabled={!latlng}>
          Google Maps’da ochish
        </Button>
      </Space>
    </Card>
  );
}
