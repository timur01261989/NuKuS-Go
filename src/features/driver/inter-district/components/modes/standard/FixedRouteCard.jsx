import React from 'react';
import { Card, Typography, Tag } from 'antd';
import { useDistrict } from '../../../context/DistrictContext';

const { Text, Title } = Typography;

export default function FixedRouteCard() {
  const { route } = useDistrict();
  const stops = route?.stops || [];

  return (
    <Card style={{ borderRadius: 16 }}>
      <Title level={5} style={{ margin: 0 }}>
        {route.from} → {route.to}
      </Title>
      <Text type="secondary" style={{ fontSize: 12 }}>
        Standart yo‘nalish (o‘zgarmas)
      </Text>

      {/* Bekatlar ketma-ketligi */}
      <div style={{ marginTop: 10 }}>
        <Text strong style={{ fontSize: 12 }}>
          Bekatlar:
        </Text>
        <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {stops.map((s, idx) => (
            <Tag key={s + idx} color={idx === 0 ? 'blue' : idx === stops.length - 1 ? 'green' : 'default'} style={{ margin: 0 }}>
              {idx === 0 ? `🅰️ ${s}` : idx === stops.length - 1 ? `🅱️ ${s}` : s}
            </Tag>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8 }}>
        Tavsiya: yo‘l bo‘yidagi bekatlar ko‘rsatilsa, haydovchi va mijozga aniqroq bo‘ladi.
      </div>
    </Card>
  );
}
