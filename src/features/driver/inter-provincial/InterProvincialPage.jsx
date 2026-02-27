import React, { useMemo, useState } from "react";
import { Button, Col, Divider, Row, Space, Typography, message } from "antd";
import { ArrowLeftOutlined, InboxOutlined } from "@ant-design/icons";

import { TripProvider, useTrip } from "./context/TripContext";
import { TRIP_STATUS } from "./context/tripReducer";
import { useTripSocket } from "./hooks/useTripSocket";
import { useLocationFeatures } from "./hooks/useLocationFeatures";

import RouteBuilder from "./components/setup/RouteBuilder";
import VisualSeatSelector from "./components/setup/VisualSeatSelector";
import DateTimePicker from "./components/setup/DateTimePicker";
import CarAmenitiesSelector from "./components/setup/CarAmenitiesSelector";
import TripStatusPanel from "./components/controls/TripStatusPanel";

import PassengerManifest from "./components/management/PassengerManifest";
import SeatRequestModal from "./components/management/SeatRequestModal";
import ParcelLogModal from "./components/management/ParcelLogModal";

import SmartRoutePanel from "./components/active/SmartRoutePanel";
import NavigationLauncher from "./components/active/NavigationLauncher";
import SafetyCheck from "./components/active/SafetyCheck";

import TripEarnings from "./components/stats/TripEarnings";

const { Title, Text } = Typography;

function PageInner() {
  const { state, dispatch } = useTrip();
  const { driverLoc } = useLocationFeatures({ enabled: true });

  // realtime seat requests
  useTripSocket({ tripId: state.tripId, dispatch });

  const [parcelOpen, setParcelOpen] = useState(false);

  const isCollecting = state.status === TRIP_STATUS.COLLECTING;
  const isDraft = state.status === TRIP_STATUS.DRAFT;

  const goOnWay = () => {
    if (!state.tripId) return message.error("Avval reysni e'lon qiling");
    dispatch({ type: "SET_STATUS", status: TRIP_STATUS.ON_WAY });
  };

  const finish = () => {
    dispatch({ type: "SET_STATUS", status: TRIP_STATUS.FINISHED });
    message.success("Safar yakunlandi (demo)");
  };

  const navTarget = useMemo(() => {
    // demo: first passenger address latlng if exists
    const p = state.passengerManifest.find((x) => x.latlng);
    return p?.latlng || null;
  }, [state.passengerManifest]);

  return (
    <div style={{ padding: 16, maxWidth: 1100, margin: "0 auto" }}>
      <Space style={{ width: "100%", justifyContent: "space-between" }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>
          Orqaga
        </Button>
        <Space>
          <Button icon={<InboxOutlined />} onClick={() => setParcelOpen(true)} disabled={!state.tripId}>
            Posilka
          </Button>
          <Button type="primary" onClick={goOnWay} disabled={!isCollecting}>
            Yo'lga chiqish
          </Button>
          <Button danger onClick={finish} disabled={state.status !== TRIP_STATUS.ON_WAY}>
            Yakunlash
          </Button>
        </Space>
      </Space>

      <Title level={3} style={{ marginTop: 10, marginBottom: 0 }}>
        Driver Inter-Provincial (PRO)
      </Title>
      <Text type="secondary">
        Status: <b>{state.status}</b> · TripId: {state.tripId || "-"} · GPS: {driverLoc ? `${driverLoc[0].toFixed(4)}, ${driverLoc[1].toFixed(4)}` : "..."}
      </Text>

      <Divider />

      <Row gutter={[12, 12]}>
        <Col xs={24} md={12}>
          <TripStatusPanel />
          <div style={{ height: 12 }} />

          {isDraft ? (
            <>
              <RouteBuilder />
              <div style={{ height: 12 }} />
              <DateTimePicker />
              <div style={{ height: 12 }} />
              <CarAmenitiesSelector />
              <div style={{ height: 12 }} />
              <VisualSeatSelector />
            </>
          ) : (
            <>
              <PassengerManifest />
              <div style={{ height: 12 }} />
              <TripEarnings />
            </>
          )}
        </Col>

        <Col xs={24} md={12}>
          {state.status === TRIP_STATUS.ON_WAY ? (
            <>
              <SmartRoutePanel origin={driverLoc} />
              <div style={{ height: 12 }} />
              <NavigationLauncher latlng={navTarget} label="Keyingi manzil (demo)" />
              <div style={{ height: 12 }} />
              <SafetyCheck />
            </>
          ) : (
            <>
              <TripEarnings />
              <div style={{ height: 12 }} />
              <Text type="secondary" style={{ display: "block" }}>
                Realtime seat so'rovlari: <b>{state.seatRequests.length}</b>
              </Text>
            </>
          )}
        </Col>
      </Row>

      <SeatRequestModal />
      <ParcelLogModal open={parcelOpen} onClose={() => setParcelOpen(false)} />
    </div>
  );
}

export default function InterProvincialPage() {
  return (
    <TripProvider>
      <PageInner />
    </TripProvider>
  );
}
