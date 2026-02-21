import React from "react";
import { Button, Card, Space, Typography, message } from "antd";
import { SafetyCertificateOutlined } from "@ant-design/icons";

const { Text } = Typography;

export default function SafetyCheck() {
  return (
    <Card style={{ borderRadius: 18 }}>
      <Space direction="vertical" size={8} style={{ width: "100%" }}>
        <Space>
          <SafetyCertificateOutlined />
          <Text strong>Xavfsizlik</Text>
        </Space>
        <Text type="secondary">Yo'lda bo'lsangiz, har 30-40 daqiqada status yuborish tavsiya.</Text>
        <Button onClick={() => message.success("✅ Men yetib keldim (demo)")}>Men yetib keldim</Button>
      </Space>
    </Card>
  );
}
