import React from 'react';
import { Card, Statistic, Row, Col, Typography } from 'antd';
import { useDistrict } from '../../context/DistrictContext';

const { Text } = Typography;

export default function TripEarnings() {
  const { pricing, seats } = useDistrict();
  const taken = Object.values(seats).filter((s) => s.taken).length;

  return (
    <Card style={{ borderRadius: 16 }}>
      <Row gutter={[12, 12]}>
        <Col xs={24} sm={12}>
          <Statistic title="Jami (taxminiy)" value={Math.round(pricing.total || 0)} suffix="so‘m" />
          <Text type="secondary" style={{ fontSize: 12 }}>
            O‘rindiqlar: {taken} ta
          </Text>
        </Col>
        <Col xs={24} sm={12}>
          <Statistic
            title="Pickup masofa/vaqt (Premium)"
            value={pricing.distanceKm != null ? pricing.distanceKm.toFixed(1) : '-'}
            suffix={pricing.distanceKm != null ? ' km' : ''}
          />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {pricing.etaMin != null ? `ETA: ${Math.round(pricing.etaMin)} daqiqa` : ''}
          </Text>
        </Col>
      </Row>
    </Card>
  );
}
