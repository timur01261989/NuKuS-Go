import React from "react";
import { Button, Card, Typography } from "antd";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

export default function DriverPending() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "#f5f6f8" }}>
      <Card style={{ width: 420, maxWidth: "100%", borderRadius: 16 }}>
        <Title level={4} style={{ marginTop: 0 }}>Haydovchi tasdiqlanmagan</Title>
        <Text type="secondary">
          Sizning haydovchi profilingiz admin tomonidan tekshirilmoqda. Tasdiqlangandan keyin haydovchi rejimiga kira olasiz.
        </Text>
        <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
          <Button type="primary" style={{ background: "#000", borderColor: "#000" }} onClick={() => navigate("/client")}>
            Yolovchi rejimiga qaytish
          </Button>
          <Button onClick={() => navigate("/driver-mode")}>Ma’lumotlarni ko‘rish</Button>
        </div>
      </Card>
    </div>
  );
}
