import React, { memo, useCallback } from "react";
import { Card, Typography, Button, Space } from "antd";
import { 
  CustomerServiceOutlined, 
  TelegramOutlined, 
  PhoneOutlined 
} from "@ant-design/icons";
import { usePageI18n } from "./pageI18n";

const { Title, Text } = Typography;

/**
 * @file Support.jsx
 * @description UniGo Super App - Centralized Support Component
 * @version 1.1.0
 * @author Senior Full-Stack Architect
 */

const Support = memo(() => {
  const { t, tx } = usePageI18n();

  // Callback for handling contact actions - Scalable for millions of users
  const handleContact = useCallback((type) => {
    switch (type) {
      case 'telegram':
        window.open("https://t.me/unigo_support", "_blank");
        break;
      case 'phone':
        window.location.href = "tel:+998000000000";
        break;
      default:
        console.log("Support contact action initiated");
    }
  }, []);

  return (
    <div 
      className="unigo-support-container"
      style={{ 
        padding: "20px 14px", 
        maxWidth: 680, 
        margin: "0 auto",
        minHeight: "100vh"
      }}
    >
      <header style={{ marginBottom: 24, textAlign: 'center' }}>
        <CustomerServiceOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
        <Title level={3} style={{ marginTop: 0 }}>
          {t.supportTitle || tx("supportSection", "Yordam markazi")}
        </Title>
        <Text type="secondary">
          {t.supportHint || tx("supportHintLocal", "UniGo jamoasi sizga yordam berishga tayyor.")}
        </Text>
      </header>

      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Card 
          hoverable 
          style={{ borderRadius: 16, border: '1px solid #f0f0f0' }}
          bodyStyle={{ padding: 20 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Title level={5} style={{ margin: 0 }}>Telegram bot</Title>
              <Text type="secondary">24/7 tezkor aloqa</Text>
            </div>
            <Button 
              type="primary" 
              shape="round" 
              icon={<TelegramOutlined />} 
              onClick={() => handleContact('telegram')}
            >
              Bog'lanish
            </Button>
          </div>
        </Card>

        <Card 
          hoverable 
          style={{ borderRadius: 16, border: '1px solid #f0f0f0' }}
          bodyStyle={{ padding: 20 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Title level={5} style={{ margin: 0 }}>Call-markaz</Title>
              <Text type="secondary">Operator bilan suhbat</Text>
            </div>
            <Button 
              type="default" 
              shape="round" 
              icon={<PhoneOutlined />} 
              onClick={() => handleContact('phone')}
            >
              Qo'ng'iroq
            </Button>
          </div>
        </Card>

        <Card style={{ borderRadius: 16, backgroundColor: '#fafafa' }}>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            {tx("workingHours", "Ish vaqti:")}
          </Text>
          <Text type="secondary">
            Dushanba - Yakshanba, 08:00 - 22:00
          </Text>
        </Card>
      </Space>
    </div>
  );
});

Support.displayName = "Support";

export default Support;