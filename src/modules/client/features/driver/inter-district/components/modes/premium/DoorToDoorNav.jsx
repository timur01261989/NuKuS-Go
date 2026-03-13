import React from 'react';
import { Card, Button, Space, Typography } from 'antd';
import { EnvironmentOutlined, RocketOutlined } from '@ant-design/icons';
import { useDistrict } from '../../../context/DistrictContext';

const { Text } = Typography;

function openMaps(lat, lng, label = 'Manzil') {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export default function DoorToDoorNav() {
  const { premiumClients, pricing } = useDistrict();
  const c = premiumClients?.[0];

  return (
    <Card title="Navigatsiya" style={{ borderRadius: 16 }}>
      {!c ? (
        <Text type="secondary">Mijoz tanlanmagan</Text>
      ) : (
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>Mijoz manzili</Text>
            <div style={{ fontSize: 12, opacity: 0.75 }}>{c.address}</div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>
              Masofa: {pricing.distanceKm != null ? `${pricing.distanceKm.toFixed(1)} km` : '-'} · ETA:{' '}
              {pricing.etaMin != null ? `${Math.round(pricing.etaMin)} daq` : '-'}
            </div>
          </div>

          <Button
            type="primary"
            icon={<RocketOutlined />}
            onClick={() => {
              if (c?.lat && c?.lng) openMaps(c.lat, c.lng, c.address);
            }}
            block
          >
            Mijozga borish (Google Maps)
          </Button>

          <Button icon={<EnvironmentOutlined />} block onClick={() => window.open('https://www.google.com/maps', '_blank')}>
            Xarita ochish
          </Button>
        </Space>
      )}

      <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
        Eslatma: Navigator integratsiyasi keyinchalik Waze/2GIS ham bo‘lishi mumkin.
      </div>
    </Card>
  );
}
