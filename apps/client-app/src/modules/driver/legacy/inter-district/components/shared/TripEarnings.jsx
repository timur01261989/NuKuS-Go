import React from 'react';
import { Card, Statistic, Row, Col, Typography, Tag, Space } from 'antd';
import { useDistrict } from '../../context/DistrictContext';
import { buildDriverTripPreview } from '@/modules/shared/interdistrict/domain/interDistrictSignals';

const { Text } = Typography;

export default function TripEarnings({ activeTrip }) {
  const { pricing, seats } = useDistrict();
  const preview = buildDriverTripPreview({ pricing, seats, activeTrip });

  return (
    <Card style={{ borderRadius: 16 }}>
      <Row gutter={[12, 12]}>
        <Col xs={24} sm={12}>
          <Statistic title="Jami (taxminiy)" value={preview.earningsLabel} suffix="so‘m" />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {preview.occupancyLabel}
          </Text>
        </Col>
        <Col xs={24} sm={12}>
          <Statistic
            title="Pickup masofa/vaqt"
            value={preview.distanceKm ? preview.distanceKm.toFixed(1) : '-'}
            suffix={preview.distanceKm ? ' km' : ''}
          />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {preview.etaMin ? `ETA: ${Math.round(preview.etaMin)} daqiqa` : 'ETA hisoblanmoqda'}
          </Text>
        </Col>
      </Row>
      <Space wrap style={{ marginTop: 12 }}>
        <Tag color="blue">Route confidence: {preview.routeConfidence}</Tag>
        <Tag color={preview.taken ? 'green' : 'default'}>Band joy: {preview.taken}</Tag>
      </Space>
    </Card>
  );
}
