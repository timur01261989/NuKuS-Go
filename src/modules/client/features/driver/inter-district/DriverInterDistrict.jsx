import React, { useState, useEffect } from "react";
import { Button, Card, Statistic, Row, Col, Typography, Space, Tag, Empty, message } from "antd";
import { PlusOutlined, CarOutlined, WalletOutlined, BellOutlined, HistoryOutlined } from "@ant-design/icons";
import TripCreateModal from "./components/shared/TripCreateModal";
import TripRequestsDrawer from "./components/shared/TripRequestsDrawer";

const { Title, Text } = Typography;

/**
 * DriverInterDistrict.jsx
 * -------------------------------------------------------
 * Haydovchining asosiy ishchi stoli.
 */
export default function DriverInterDistrict() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRequestsOpen, setIsRequestsOpen] = useState(false);
  const [activeTrip, setActiveTrip] = useState(null);
  const [stats, setStats] = useState({ balance: 0, tripsToday: 0 });

  // Reys yaratilgandan keyingi holat
  const handleTripCreated = (payload) => {
    setActiveTrip(payload);
    message.success("Reys faollashtirildi. Endi mijozlar sizni ko'ra olishadi.");
  };

  return (
    <div style={{ padding: "16px", background: "#f0f2f5", minHeight: "100vh" }}>
      {/* HEADER: Balans va Bildirishnoma */}
      <Card style={{ borderRadius: 20, marginBottom: 16, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Space direction="vertical" size={0}>
              <Text type="secondary">Sizning balansingiz</Text>
              <Title level={3} style={{ margin: 0, color: "#1677ff" }}>
                {new Intl.NumberFormat("uz-UZ").format(45000)} so'm
              </Title>
            </Space>
          </Col>
          <Col>
            <Button 
              shape="circle" 
              icon={<BellOutlined />} 
              size="large" 
              onClick={() => setIsRequestsOpen(true)}
              type={activeTrip ? "primary" : "default"}
            />
          </Col>
        </Row>
      </Card>

      {/* ACTIVE TRIP SECTION */}
      <Title level={4}>Joriy holat</Title>
      {!activeTrip ? (
        <Card style={{ borderRadius: 20, textAlign: "center", padding: "20px 0" }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Hozircha faol reys yo'q"
          />
          <Button 
            type="primary" 
            size="large" 
            icon={<PlusOutlined />} 
            onClick={() => setIsCreateModalOpen(true)}
            style={{ borderRadius: 12, height: 50, marginTop: 10, width: "80%" }}
          >
            Yangi reys yaratish
          </Button>
        </Card>
      ) : (
        <Card 
          style={{ borderRadius: 20, borderLeft: "6px solid #52c41a" }}
          title={<Tag color="green">REYS FAOAL</Tag>}
          extra={<Button type="link" danger onClick={() => setActiveTrip(null)}>Yakunlash</Button>}
        >
          <Space direction="vertical" style={{ width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Text strong style={{ fontSize: 16 }}>{activeTrip.from_district} → {activeTrip.to_district}</Text>
            </div>
            <div style={{ marginTop: 8 }}>
              {activeTrip.has_eltish && <Tag color="blue">📦 Eltish yoqilgan</Tag>}
              {activeTrip.has_yuk && <Tag color="orange">🚚 Yuk yoqilgan</Tag>}
              {activeTrip.female_only && <Tag color="magenta">👩 Ayollar uchun</Tag>}
            </div>
            <Divider style={{ margin: "12px 0" }} />
            <Button 
              block 
              type="dashed" 
              icon={<HistoryOutlined />}
              onClick={() => setIsRequestsOpen(true)}
            >
              So'rovlarni ko'rish
            </Button>
          </Space>
        </Card>
      )}

      {/* QUICK STATS */}
      <Row gutter={12} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card size="small" style={{ borderRadius: 15 }}>
            <Statistic title="Bugungi reyslar" value={3} prefix={<CarOutlined />} />
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small" style={{ borderRadius: 15 }}>
            <Statistic title="Reyting" value={4.9} precision={1} prefix={<Text style={{color: "#fadb14"}}>★</Text>} />
          </Card>
        </Col>
      </Row>

      {/* MODALS */}
      <TripCreateModal 
        open={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onSuccess={handleTripCreated}
      />
      <TripRequestsDrawer 
        open={isRequestsOpen} 
        onClose={() => setIsRequestsOpen(false)} 
      />
    </div>
  );
}