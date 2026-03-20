
import React from "react";
import { Layout, Row, Col, Space, Typography, Button, Badge, Tooltip } from "antd";
import { BellOutlined, CarOutlined, PlusOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { DistrictProvider } from "./context/DistrictContext";
import TripCreateModal from "./components/shared/TripCreateModal";
import PitakAdminModal from "./components/shared/PitakAdminModal";
import TripRequestsDrawer from "./components/shared/TripRequestsDrawer";
import ParcelEntryModal from "./components/parcel/ParcelEntryModal";
import DriverOnlineToggle from "../components/DriverOnlineToggle";
import { useDriverInterDistrictController } from "./hooks/useDriverInterDistrictController";
import DriverActiveTripPanel from "./components/panels/DriverActiveTripPanel";
import DriverTripModePanels from "./components/panels/DriverTripModePanels";
import "./styles/theme.css";

const { Header, Content } = Layout;
const { Title } = Typography;

function Inner({ onBack }) {
  const {
    cp,
    mode,
    MODES,
    serviceType,
    serviceActive,
    passengerEnabled,
    deliveryEnabled,
    freightEnabled,
    activeVehicle,
    activeTrip,
    tripFlags,
    tripCreateOpen,
    setTripCreateOpen,
    pitakAdminOpen,
    setPitakAdminOpen,
    requestsOpen,
    setRequestsOpen,
    parcelOpen,
    setParcelOpen,
    handleTripCreated,
    beforeToggleOnline,
    queueHealth,
    socketMeta,
    conflictGuard,
    respondingRequestId,
    setRespondingRequestId,
    reservationReadiness,
  } = useDriverInterDistrictController();

  return (
    <Layout style={{ minHeight: "100vh", background: "#f5f7fa" }}>
      <Header
        style={{
          background: "#fff",
          padding: "0 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          position: "sticky",
          top: 0,
          zIndex: 100,
          height: 64,
        }}
      >
        <Space align="center">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={onBack}
            style={{ fontSize: 18 }}
          />
          <div style={{ width: 35, height: 35, background: "#1677ff", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CarOutlined style={{ color: "#fff", fontSize: 20 }} />
          </div>
          <Title level={4} style={{ margin: 0 }}>{cp("Haydovchi Paneli")}</Title>
        </Space>

        <Space size="middle">
          <Tooltip title={serviceActive ? cp("Hozir onlaynsiz") : cp("Oflayn holatdasiz")}>
            <DriverOnlineToggle
              serviceType={serviceType}
              checkedChildren="ON"
              unCheckedChildren="OFF"
              onBeforeOnline={beforeToggleOnline}
            />
          </Tooltip>
          <Badge count={5} size="small">
            <Button type="text" icon={<BellOutlined style={{ fontSize: 20 }} />} onClick={() => setRequestsOpen(true)} />
          </Badge>
          <Button type="primary" shape="circle" icon={<PlusOutlined />} onClick={() => setTripCreateOpen(true)} />
        </Space>
      </Header>

      <Content style={{ padding: "20px" }}>
        <DriverActiveTripPanel
          activeTrip={activeTrip}
          tripFlags={tripFlags}
          onReload={() => window.location.reload()}
          onOpenParcel={() => setParcelOpen(true)}
          onOpenSettings={() => setPitakAdminOpen(true)}
          deliveryEnabled={deliveryEnabled}
          freightEnabled={freightEnabled}
        />

        <Row gutter={[16, 16]}>
          <DriverTripModePanels mode={mode} MODES={MODES} activeTrip={activeTrip} queueHealth={queueHealth} socketMeta={socketMeta} reservationReadiness={reservationReadiness} />
        </Row>

        <ParcelEntryModal open={parcelOpen} onClose={() => setParcelOpen(false)} deliveryEnabled={deliveryEnabled} freightEnabled={freightEnabled} activeVehicle={activeVehicle} />
        <TripCreateModal
          open={tripCreateOpen}
          onClose={() => setTripCreateOpen(false)}
          isOnline={serviceActive}
          onSuccess={handleTripCreated}
          passengerEnabled={passengerEnabled}
          deliveryEnabled={deliveryEnabled}
          freightEnabled={freightEnabled}
          activeVehicle={activeVehicle}
        />
        <PitakAdminModal open={pitakAdminOpen} onClose={() => setPitakAdminOpen(false)} />
        <TripRequestsDrawer open={requestsOpen} onClose={() => setRequestsOpen(false)} activeTrip={activeTrip} conflictGuard={conflictGuard} respondingRequestId={respondingRequestId} setRespondingRequestId={setRespondingRequestId} />
      </Content>
    </Layout>
  );
}

export default function InterDistrictPage() {
  return (
    <DistrictProvider>
      <Inner />
    </DistrictProvider>
  );
}
