import React, { useEffect } from "react";
import { Card, Button, Typography, Divider, Space, Tag } from "antd";
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  EnvironmentTwoTone, 
  DollarCircleOutlined,
  CarOutlined 
} from "@ant-design/icons";
import { playAliceVoice } from "../../../utils/AudioPlayer.js";

const { Title, Text } = Typography;

const NewOrderModal = ({ order, onAccept, onDecline }) => {
  
  // Komponent ochilganda ovoz berish
  useEffect(() => {
    // 1. Darhol chalamiz
    playAliceVoice("new_order");

    // 2. Har 3 soniyada qaytaramiz (haydovchi eshitishi uchun)
    const interval = setInterval(() => {
      playAliceVoice("new_order");
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  if (!order) return null;

  return (
    <div className="order-overlay">
      <div className="pulse-ring"></div>
      
      <Card 
        className="order-card"
        bordered={false}
        bodyStyle={{ padding: "20px" }}
      >
        <div style={{ textAlign: "center", marginBottom: 15 }}>
          <Title level={3} style={{ margin: 0, color: "#faad14" }}>
            Yangi Buyurtma! 🔔
          </Title>
          <Text type="secondary">Qabul qilishga ulguring</Text>
        </div>

        <div className="order-details">
          <div className="detail-row">
            <EnvironmentTwoTone twoToneColor="#52c41a" style={{ fontSize: 24 }} />
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>Qayerdan:</Text>
              <div style={{ fontWeight: 700, fontSize: 16 }}>
                {order.pickup_location || order.address || "Manzil aniqlanmoqda"}
              </div>
            </div>
          </div>

          <div className="route-line"></div>

          {order.dropoff_location && (
            <div className="detail-row">
              <EnvironmentTwoTone twoToneColor="#eb2f96" style={{ fontSize: 24 }} />
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Qayerga:</Text>
                <div style={{ fontWeight: 700, fontSize: 16 }}>
                  {order.dropoff_location}
                </div>
              </div>
            </div>
          )}

          <Divider style={{ margin: "15px 0" }} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <DollarCircleOutlined style={{ fontSize: 22, color: "#1890ff" }} />
              <div style={{ fontSize: 24, fontWeight: 900 }}>
                {parseInt(order.price || 0).toLocaleString()} <span style={{ fontSize: 14, fontWeight: 400 }}>so'm</span>
              </div>
            </div>
            
            {order.distance && (
              <Tag color="blue" icon={<CarOutlined />}>
                ~{order.distance} km
              </Tag>
            )}
          </div>
        </div>

        <Space direction="vertical" style={{ width: "100%", marginTop: 25 }} size={12}>
          <Button 
            type="primary" 
            block 
            size="large" 
            icon={<CheckCircleOutlined />}
            onClick={onAccept}
            className="accept-btn"
            style={{ 
              height: 60, 
              fontSize: 20, 
              fontWeight: 800, 
              borderRadius: 16,
              background: "linear-gradient(90deg, #1d976c, #93f9b9)",
              border: "none",
              color: "#000"
            }}
          >
            QABUL QILISH
          </Button>

          <Button 
            danger 
            block 
            size="large" 
            icon={<CloseCircleOutlined />}
            onClick={onDecline}
            style={{ 
              height: 50, 
              borderRadius: 16, 
              fontWeight: 600 
            }}
          >
            Rad etish
          </Button>
        </Space>
      </Card>

      <style>{`
        .order-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(5px);
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: fadeIn 0.3s ease-out;
        }

        .order-card {
          width: 100%;
          max-width: 400px;
          border-radius: 24px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.3);
          position: relative;
          z-index: 2001;
          animation: slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        /* Yurak urishi effekti */
        .pulse-ring {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 24px;
          border: 2px solid #faad14;
          top: 0; left: 0;
          animation: pulse-border 1.5s infinite;
          pointer-events: none;
        }

        .detail-row {
          display: flex;
          align-items: flex-start;
          gap: 15px;
          padding: 8px 0;
        }

        .route-line {
          width: 2px;
          height: 20px;
          background: #e0e0e0;
          margin-left: 11px; /* Icon o'rtasiga to'g'irlash */
          margin-top: -5px;
          margin-bottom: -5px;
        }

        .accept-btn {
          animation: btnPulse 2s infinite;
        }

        @keyframes pulse-border {
          0% { transform: scale(0.95); opacity: 1; }
          100% { transform: scale(1.1); opacity: 0; }
        }

        @keyframes btnPulse {
          0% { box-shadow: 0 0 0 0 rgba(29, 151, 108, 0.7); }
          70% { box-shadow: 0 0 0 15px rgba(29, 151, 108, 0); }
          100% { box-shadow: 0 0 0 0 rgba(29, 151, 108, 0); }
        }

        @keyframes slideUp {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default NewOrderModal;