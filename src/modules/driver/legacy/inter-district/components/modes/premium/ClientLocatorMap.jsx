import React, { useMemo } from 'react';
import { Card, List, Button, Typography, Space, Tag } from 'antd';
import { AimOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useDistrict } from '../../../context/DistrictContext';

const { Text } = Typography;

export default function ClientLocatorMap() {
  const { premiumClients, locateOnce, driverLoc } = useDistrict();

  const subtitle = useMemo(() => {
    if (!driverLoc) return "GPS: yoqilmagan";
    return `GPS: ${driverLoc[0].toFixed(4)}, ${driverLoc[1].toFixed(4)}`;
  }, [driverLoc]);

  return (
    <Card
      title={
        <Space>
          <EnvironmentOutlined />
          <span>Mijozlar Lokatsiyasi</span>
        </Space>
      }
      extra={
        <Button icon={<AimOutlined />} onClick={locateOnce}>
          Joylashuvim
        </Button>
      }
      style={{ borderRadius: 16 }}
    >
      <Text type="secondary" style={{ fontSize: 12 }}>
        {subtitle}
      </Text>

      {/* Real loyihada bu yerga Leaflet/Mapbox xarita qo'yiladi.
          Hozir demo: mijozlar ro'yxati va tezkor tanlash. */}
      <List
        style={{ marginTop: 10 }}
        dataSource={premiumClients}
        locale={{ emptyText: 'Hozircha yangi buyurtma yo‘q (Realtime kelganda ko‘rinadi)' }}
        renderItem={(c) => (
          <List.Item>
            <div style={{ width: '100%' }}>
              <Space style={{ width: '100%', justifyContent: 'space-between' }} align="start">
                <div>
                  <Text strong>{c.name}</Text>
                  <div style={{ fontSize: 12, opacity: 0.75 }}>{c.address || 'Manzil: (noma’lum)'}</div>
                  <div style={{ fontSize: 12, opacity: 0.6 }}>{c.phone}</div>
                </div>
                <Tag color="gold" style={{ margin: 0 }}>
                  {c.requestedSeats || 1} joy
                </Tag>
              </Space>
            </div>
          </List.Item>
        )}
      />

      <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
        Premium rejimda mijoz pinlari real vaqt rejimida keladi (Supabase Realtime).
      </div>
    </Card>
  );
}
