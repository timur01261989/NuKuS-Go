import React, { memo, useCallback } from "react";
import { Card, Typography, Button, Space } from "antd";
import { 
  CustomerServiceOutlined, 
  SendOutlined, 
  PhoneOutlined 
} from "@ant-design/icons";
import { usePageI18n } from "./pageI18n";

const { Title, Text } = Typography;

/**
 * @file Support.jsx
 * @description UniGo Super App - Centralized Support Component with Fixed Icon Imports
 * @version 1.1.1
 * @author Senior Full-Stack Architect
 */

const Support = memo(() => {
  const { t, tx } = usePageI18n();

  // Optimized Callback for high-load systems handling millions of users
  const handleContact = useCallback((type) => {
    switch (type) {
      case 'telegram':
        window.open("https://t.me/unigo_support", "_blank");
        break;
      case 'phone':
        window.location.href = "tel:+998000000000";
        break;
      default:
        console.warn("Unsupported support channel triggered.");
    }
  }, []);

  return (
    <div 
      className="unigo-support-page"
      style={{ 
        padding: "24px 16px", 
        maxWidth: 720, 
        margin: "0 auto",
        minHeight: "100vh"
      }}
    >
      {/* Header Section */}
      <header style={{ marginBottom: 32, textAlign: 'center' }}>
        <CustomerServiceOutlined style={{ fontSize: 56, color: '#1890ff', marginBottom: 20 }} />
        <Title level={3} style={{ marginTop: 0, fontWeight: 700 }}>
          {t.supportTitle || tx("supportSection", "Yordam markazi")}
        </Title>
        <Text type="secondary" style={{ fontSize: 16 }}>
          {t.supportHint || tx("supportHintLocal", "UniGo jamoasi sizga xizmat ko'rsatishdan mamnun.")}
        </Text>
      </header>

      {/* Support Channels */}
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Card 
          hoverable 
          style={{ borderRadius: 16, border: '1px solid #f0f0f0', overflow: 'hidden' }}
          bodyStyle={{ padding: 24 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ flex: '1 1 200px' }}>
              <Title level={5} style={{ margin: 0 }}>Telegram bot</Title>
              <Text type="secondary">Tezkor savol-javoblar va texnik yordam</Text>
            </div>
            <Button 
              type="primary" 
              size="large"
              shape="round" 
              icon={<SendOutlined style={{ transform: 'rotate(-45deg)' }} />} 
              onClick={() => handleContact('telegram')}
              style={{ backgroundColor: '#0088cc', borderColor: '#0088cc' }}
            >
              Bog'lanish
            </Button>
          </div>
        </Card>

        <Card 
          hoverable 
          style={{ borderRadius: 16, border: '1px solid #f0f0f0' }}
          bodyStyle={{ padding: 24 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ flex: '1 1 200px' }}>
              <Title level={5} style={{ margin: 0 }}>Call-markaz</Title>
              <Text type="secondary">Operator bilan bevosita suhbatlashish</Text>
            </div>
            <Button 
              type="default" 
              size="large"
              shape="round" 
              icon={<PhoneOutlined />} 
              onClick={() => handleContact('phone')}
            >
              Qo'ng'iroq
            </Button>
          </div>
        </Card>

        {/* Operational Info Section */}
        <Card style={{ borderRadius: 16, backgroundColor: '#f9f9f9', border: 'none' }}>
          <Space direction="vertical" size={4}>
            <Text strong style={{ color: '#595959' }}>
              {tx("workingHours", "Ish tartibi:")}
            </Text>
            <Text type="secondary">
              Dushanba — Yakshanba: 08:00 dan 22:00 gacha
            </Text>
            <Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
              * Bayram kunlari ish vaqti o'zgarishi mumkin.
            </Text>
          </Space>
        </Card>
      </Space>
    </div>
  );
});

Support.displayName = "Support";

export default Support;