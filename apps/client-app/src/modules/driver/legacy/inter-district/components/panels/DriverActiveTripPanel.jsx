
import React from "react";
import { AppstoreAddOutlined, InboxOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { Card, Col, Row, Space, Tag, Typography, Button } from "antd";

const { Title } = Typography;

export default function DriverActiveTripPanel({ activeTrip, tripFlags, onReload, onOpenParcel, onOpenSettings, deliveryEnabled, freightEnabled }) {
  return (
    <Card style={{ borderRadius: 16, marginBottom: 20, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
      <Row gutter={[16, 16]} align="middle">
        <Col xs={24} sm={12}>
          <Space direction="vertical" size={2}>
            <Typography.Text type="secondary">Joriy holat:</Typography.Text>
            <Title level={3} style={{ margin: 0 }}>
              {activeTrip ? `${activeTrip.from_district} → ${activeTrip.to_district}` : "Reys mavjud emas"}
            </Title>
            {activeTrip && (
              <Space style={{ marginTop: 8 }} wrap>
                {tripFlags.hasDelivery && <Tag color="blue" icon={<InboxOutlined />}>Eltish: Yoqilgan</Tag>}
                {tripFlags.hasFreight && <Tag color="orange" icon={<AppstoreAddOutlined />}>Yuk: Yoqilgan</Tag>}
                {tripFlags.womenOnly && <Tag color="magenta" icon={<SafetyCertificateOutlined />}>Faqat ayollar uchun</Tag>}
              </Space>
            )}
          </Space>
        </Col>
        <Col xs={24} sm={12} style={{ textAlign: "right" }}>
          <Space>
            <Button onClick={onReload}>Yangilash</Button>
            <Button disabled={!deliveryEnabled && !freightEnabled} onClick={onOpenParcel}>Eltishlar</Button>
            <Button onClick={onOpenSettings}>Sozlamalar</Button>
          </Space>
        </Col>
      </Row>
    </Card>
  );
}
