import React from "react";
import { Col, Card, Tag, Space, Typography } from "antd";
import ModeSwitchToggle from "../shared/ModeSwitchToggle";
import TripEarnings from "../shared/TripEarnings";
import CarSeatVisualizer from "../shared/CarSeatVisualizer";
import PitakQueueBoard from "../modes/standard/PitakQueueBoard";
import FixedRouteCard from "../modes/standard/FixedRouteCard";
import PassengerListSimple from "../modes/standard/PassengerListSimple";
import ClientLocatorMap from "../modes/premium/ClientLocatorMap";
import DoorToDoorNav from "../modes/premium/DoorToDoorNav";
import DynamicPriceCard from "../modes/premium/DynamicPriceCard";

export default function DriverTripModePanels({ mode, MODES, activeTrip, queueHealth, socketMeta, reservationReadiness }) {
  return (
    <>
      <Col xs={24} lg={8}>
        <ModeSwitchToggle />
      </Col>
      <Col xs={24} lg={8}>
        <TripEarnings activeTrip={activeTrip} />
      </Col>
      <Col xs={24} lg={8}>
        <CarSeatVisualizer />
      </Col>

      <Col xs={24}>
        <Card style={{ borderRadius: 16 }}>
          <Space wrap>
            <Tag color={queueHealth?.tone === 'success' ? 'green' : queueHealth?.tone === 'processing' ? 'blue' : 'orange'}>
              Queue: {queueHealth?.count ?? 0} ta
            </Tag>
            <Tag color="purple">Issiq lead: {queueHealth?.hotCount ?? 0} ta</Tag>
            <Tag color={socketMeta?.state === 'ready' ? 'green' : socketMeta?.state === 'connecting' ? 'blue' : 'orange'}>
              Socket: {socketMeta?.state || 'idle'}
            </Tag>
            <Tag color={reservationReadiness?.ready ? 'green' : 'default'}>
              {reservationReadiness?.label || 'Bron holati aniqlanmoqda'}
            </Tag>
          </Space>
          <Typography.Paragraph type="secondary" style={{ marginTop: 10, marginBottom: 0 }}>
            {queueHealth?.freshnessLabel || "Queue holati yangilanmoqda"}
          </Typography.Paragraph>
        </Card>
      </Col>

      {mode === MODES.STANDARD ? (
        <>
          <Col xs={24} lg={8}><PitakQueueBoard /></Col>
          <Col xs={24} lg={8}><FixedRouteCard /></Col>
          <Col xs={24} lg={8}><PassengerListSimple /></Col>
        </>
      ) : (
        <>
          <Col xs={24} lg={8}><ClientLocatorMap /></Col>
          <Col xs={24} lg={8}><DoorToDoorNav /></Col>
          <Col xs={24} lg={8}><DynamicPriceCard /></Col>
        </>
      )}
    </>
  );
}
