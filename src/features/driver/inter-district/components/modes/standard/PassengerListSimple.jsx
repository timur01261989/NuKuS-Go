import React from 'react';
import { Card, List, Typography } from 'antd';
import { useDistrict } from '../../../context/DistrictContext';

const { Text } = Typography;

export default function PassengerListSimple() {
  const { passengers } = useDistrict();

  return (
    <Card title="Yo‘lovchilar" style={{ borderRadius: 16 }}>
      <List
        dataSource={passengers}
        locale={{ emptyText: 'Hali yo‘lovchi yo‘q' }}
        renderItem={(p) => (
          <List.Item>
            <div>
              <Text strong>{p.name}</Text>
              <div style={{ fontSize: 12, opacity: 0.7 }}>{p.phone}</div>
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {p.seatKey}
            </Text>
          </List.Item>
        )}
      />
      <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
        Oddiy ro‘yxat: faqat ism va telefon.
      </div>
    </Card>
  );
}
