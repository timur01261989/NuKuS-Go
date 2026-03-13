import React from 'react';
import { Segmented, Space, Typography, Card, Switch, Divider, Tag } from 'antd';
import { 
  RocketOutlined, 
  CoffeeOutlined, 
  InboxOutlined, 
  ReconciliationOutlined, 
  SafetyCertificateOutlined 
} from '@ant-design/icons';
import { useDistrict } from '../../context/DistrictContext';

const { Text } = Typography;

/**
 * ModeSwitchToggle.jsx
 * -------------------------------------------------------
 * Haydovchi uchun asosiy boshqaruv paneli.
 * - Standart va Premium rejimlar almashinuvi
 * - Eltish, Yuk va Ayollar rejimi statuslarini boshqarish
 */
export default function ModeSwitchToggle() {
  const { 
    mode, 
    MODES, 
    setMode,
    // Context'dan yangi holatlar va funksiyalarni olamiz
    hasEltish,
    setHasEltish,
    hasYuk,
    setHasYuk,
    femaleOnly,
    setFemaleOnly
  } = useDistrict();

  return (
    <Card 
      size="small" 
      style={{ borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
      bodyStyle={{ padding: '12px 16px' }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size={12}>
        {/* REJIMNI TANLASH (STANDART / PREMIUM) */}
        <div>
          <Text strong style={{ fontSize: 13, color: '#8c8c8c', display: 'block', marginBottom: 8 }}>
            ASOSIY ISH REJIMI
          </Text>
          <Segmented
            block
            size="large"
            value={mode}
            onChange={(v) => setMode(v)}
            options={[
              { 
                label: (
                  <div style={{ padding: '4px 0' }}>
                    <CoffeeOutlined />
                    <div>Standart</div>
                  </div>
                ), 
                value: MODES.STANDARD 
              },
              { 
                label: (
                  <div style={{ padding: '4px 0' }}>
                    <RocketOutlined />
                    <div>Premium</div>
                  </div>
                ), 
                value: MODES.PREMIUM 
              },
            ]}
            style={{ borderRadius: 12, padding: 4 }}
          />
        </div>

        <Divider style={{ margin: '4px 0' }} />

        {/* QO'SHIMCHA XIZMATLARNI TEZKOR BOSHQARISH */}
        <div>
          <Text strong style={{ fontSize: 13, color: '#8c8c8c', display: 'block', marginBottom: 12 }}>
            FAOL XIZMATLAR
          </Text>
          
          <Space direction="vertical" style={{ width: '100%' }} size={16}>
            
            {/* Eltish (Pochta) Switch */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <div style={{ 
                  width: 32, height: 32, borderRadius: 8, 
                  background: 'rgba(22, 119, 255, 0.1)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center' 
                }}>
                  <InboxOutlined style={{ color: '#1677ff', fontSize: 18 }} />
                </div>
                <div>
                  <Text strong style={{ display: 'block', lineHeight: 1 }}>Eltish</Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>Pochta qabul qilish</Text>
                </div>
              </Space>
              <Switch 
                checked={hasEltish} 
                onChange={(val) => setHasEltish(val)} 
                size="small"
              />
            </div>

            {/* Yuk olaman Switch */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <div style={{ 
                  width: 32, height: 32, borderRadius: 8, 
                  background: 'rgba(250, 140, 22, 0.1)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center' 
                }}>
                  <ReconciliationOutlined style={{ color: '#fa8c16', fontSize: 18 }} />
                </div>
                <div>
                  <Text strong style={{ display: 'block', lineHeight: 1 }}>Yuk olaman</Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>Bagaj xizmati</Text>
                </div>
              </Space>
              <Switch 
                checked={hasYuk} 
                onChange={(val) => setHasYuk(val)} 
                size="small"
              />
            </div>

            {/* Faqat Ayollar uchun Switch */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <div style={{ 
                  width: 32, height: 32, borderRadius: 8, 
                  background: 'rgba(235, 47, 150, 0.1)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center' 
                }}>
                  <SafetyCertificateOutlined style={{ color: '#eb2f96', fontSize: 18 }} />
                </div>
                <div>
                  <Text strong style={{ display: 'block', lineHeight: 1, color: femaleOnly ? '#eb2f96' : 'inherit' }}>
                    Ayollar uchun
                  </Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>Xavfsiz qatnov</Text>
                </div>
              </Space>
              <Switch 
                checked={femaleOnly} 
                onChange={(val) => setFemaleOnly(val)} 
                size="small"
                className={femaleOnly ? 'female-switch-active' : ''}
              />
            </div>

          </Space>
        </div>

        {/* JORIY STATUS TAGLARI */}
        <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {hasEltish && <Tag color="blue" bordered={false} style={{ fontSize: 10 }}>📦 Eltish ON</Tag>}
          {hasYuk && <Tag color="orange" bordered={false} style={{ fontSize: 10 }}>🚚 Yuk ON</Tag>}
          {femaleOnly && <Tag color="magenta" bordered={false} style={{ fontSize: 10 }}>👩 Ayollar ON</Tag>}
        </div>
      </Space>
    </Card>
  );
}