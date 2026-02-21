import React from 'react';
import { Button, Card, Space, Statistic, Typography } from 'antd';
import { usePitakLogic } from '../../../hooks/usePitakLogic';

const { Text } = Typography;

export default function PitakQueueBoard() {
  // driverId demo: keyinchalik auth'dan oling
  const driverId = 'demo-driver-1';
  const { queue, loading, join, refresh } = usePitakLogic({ driverId, enabled: true });

  return (
    <Card title="Pitak Navbati" style={{ borderRadius: 16 }}>
      <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
        <div>
          <Statistic title="Navbat" value={queue.position ?? '-'} suffix={queue.position ? '' : ''} />
          <Text type="secondary" style={{ fontSize: 12 }}>
            Umumiy: {queue.total}
          </Text>
        </div>
        <Space direction="vertical">
          <Button type="primary" loading={loading} onClick={join}>
            Navbatga turish
          </Button>
          <Button loading={loading} onClick={refresh}>
            Yangilash
          </Button>
        </Space>
      </Space>

      <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8 }}>
        Standart rejim: markazdan-markazgacha. Xarita shart emas, navbat muhim.
      </div>
    </Card>
  );
}
