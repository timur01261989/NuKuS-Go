import React, { useState } from "react";
import { Alert, Button, Card, Input, Space, Typography } from "antd";
import SupportChatPage from "../support/SupportChatPage";

const { Title, Text } = Typography;

export default function SupportChatPanel() {
  const [orderId, setOrderId] = useState("");
  const [role, setRole] = useState("client");
  const [show, setShow] = useState(false);

  return (
    <div style={{ padding: 12 }}>
      <Space direction="vertical" size={10} style={{ width: "100%" }}>
        <Title level={4} style={{ margin: 0 }}>
          Support Chat (Demo)
        </Title>
        <Text type="secondary">Order ID kiriting, thread avtomatik yaratiladi.</Text>

        <Card size="small">
          <Space wrap>
            <Input style={{ width: 320 }} placeholder="order_id" value={orderId} onChange={(e) => setOrderId(e.target.value)} />
            <Input style={{ width: 140 }} placeholder="role (client/driver)" value={role} onChange={(e) => setRole(e.target.value)} />
            <Button type="primary" onClick={() => setShow(true)} disabled={!orderId}>
              Open
            </Button>
            <Button onClick={() => setShow(false)}>Hide</Button>
          </Space>
        </Card>

        {!orderId ? <Alert type="info" showIcon message="Order ID bo‘lsa demo ochiladi." /> : null}

        {show && orderId ? (
          <div style={{ border: "1px solid #eee", borderRadius: 12 }}>
            {/* Render the same page but with injected params via key */}
            <SupportChatPage key={`${role}:${orderId}`} role={role} orderId={orderId} />
          </div>
        ) : null}
      </Space>
    </div>
  );
}
