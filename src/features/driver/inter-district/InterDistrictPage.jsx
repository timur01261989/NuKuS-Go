import React, { useMemo, useState, useCallback } from 'react';
import { Layout, Row, Col, Space, Typography, Button, message, Tooltip, Card, Badge } from 'antd';
import { 
  ReloadOutlined, 
  InboxOutlined, 
  PlusOutlined, 
  BellOutlined, 
  CarOutlined, 
  SettingOutlined,
  SafetyCertificateOutlined,
  AppstoreAddOutlined
} from '@ant-design/icons';

import { DistrictProvider, useDistrict } from './context/DistrictContext';
import ModeSwitchToggle from './components/shared/ModeSwitchToggle';
import CarSeatVisualizer from './components/shared/CarSeatVisualizer';
import TripEarnings from './components/shared/TripEarnings';
import TripCreateModal from './components/shared/TripCreateModal';
import PitakAdminModal from './components/shared/PitakAdminModal';
import TripRequestsDrawer from './components/shared/TripRequestsDrawer';

import PitakQueueBoard from './components/modes/standard/PitakQueueBoard';
import FixedRouteCard from './components/modes/standard/FixedRouteCard';
import PassengerListSimple from './components/modes/standard/PassengerListSimple';

import ClientLocatorMap from './components/modes/premium/ClientLocatorMap';
import DoorToDoorNav from './components/modes/premium/DoorToDoorNav';
import DynamicPriceCard from './components/modes/premium/DynamicPriceCard';

import ParcelEntryModal from './components/parcel/ParcelEntryModal';

import { usePremiumSocket } from './hooks/usePremiumSocket';
import DriverOnlineToggle from '../components/DriverOnlineToggle';
import { useDriverOnline } from '../core/useDriverOnline';
import { canUseOrderTypeInArea } from '../core/driverCapabilityService';
import { canActivateService } from '../core/serviceGuards';

import './styles/theme.css';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

/**
 * Inner Component
 * Sahifaning asosiy mantiqiy qismi
 */
function Inner() {
  const { cp } = useDriverText();
  const { mode, MODES, upsertPremiumClient, lastError, locateOnce } = useDistrict();
  const { isOnline, activeService, setOnline, setOffline, serviceTypes, activeVehicle } = useDriverOnline();
  const serviceType = 'interDist';
  const serviceActive = isOnline && activeService === serviceType;
  const passengerEnabled = useMemo(() => canUseOrderTypeInArea({ serviceTypes }, 'interdistrict', 'passenger'), [serviceTypes]);
  const deliveryEnabled = useMemo(() => canUseOrderTypeInArea({ serviceTypes }, 'interdistrict', 'delivery'), [serviceTypes]);
  const freightEnabled = useMemo(() => canUseOrderTypeInArea({ serviceTypes }, 'interdistrict', 'freight'), [serviceTypes]);

  // State boshqaruvi
  const [tripCreateOpen, setTripCreateOpen] = useState(false);
  const [pitakAdminOpen, setPitakAdminOpen] = useState(false);
  const [requestsOpen, setRequestsOpen] = useState(false);
  const [parcelOpen, setParcelOpen] = useState(false);
  
  // Haydovchi holati (Active trip info)
  const [activeTrip, setActiveTrip] = useState(null);

  // Soket ulanishi (Premium rejim uchun)
  usePremiumSocket({
    enabled: serviceActive && mode === MODES.PREMIUM,
    onClientRequest: (req) => {
      upsertPremiumClient(req);
      message.info(cp("Yangi buyurtma keldi!"));
    },
  });

  // Reys yaratilgandagi callback
  const handleTripCreated = (data) => {
    setActiveTrip(data);
    setTripCreateOpen(false);
    setOnline(serviceType);
    message.success(cp("Reys muvaffaqiyatli e'lon qilindi!"));
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f7fa' }}>
      <Header
        style={{
          background: '#fff',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          height: 64
        }}
      >
        <Space align="center">
          <div style={{ 
            width: 35, 
            height: 35, 
            background: '#1677ff', 
            borderRadius: 10, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <CarOutlined style={{ color: '#fff', fontSize: 20 }} />
          </div>
          <Title level={4} style={{ margin: 0 }}>{cp("Haydovchi Paneli")}</Title>
        </Space>

        <Space size="middle">

<Tooltip title={serviceActive ? cp("Hozir onlaynsiz") : cp("Oflayn holatdasiz")}>
  <DriverOnlineToggle
    serviceType={serviceType}
    checkedChildren="ON"
    unCheckedChildren="OFF"
    onBeforeOnline={() => {
      if (!canActivateService(activeService, serviceType)) {
        message.warning(cp("Avval boshqa xizmatni offline qiling"));
        return false;
      }
      if (!activeTrip) {
        setTripCreateOpen(true);
        return false;
      }
      return true;
    }}
  />
</Tooltip>
          
          <Badge count={5} size="small">
            <Button 
              type="text" 
              icon={<BellOutlined style={{ fontSize: 20 }} />} 
              onClick={() => setRequestsOpen(true)} 
            />
          </Badge>
          
          <Button 
            type="primary" 
            shape="circle" 
            icon={<PlusOutlined />} 
            onClick={() => setTripCreateOpen(true)} 
          />
        </Space>
      </Header>

      <Content style={{ padding: '20px' }}>
        {/* Yuqori qism: Haydovchi status kartasi */}
        <Card style={{ borderRadius: 16, marginBottom: 20, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12}>
              <Space direction="vertical" size={2}>
                <Text type="secondary">Joriy holat:</Text>
                <Title level={3} style={{ margin: 0 }}>
                  {activeTrip ? `${activeTrip.from_district} → ${activeTrip.to_district}` : "Reys mavjud emas"}
                </Title>
                {activeTrip && (
                  <Space style={{ marginTop: 8 }} wrap>
                    {activeTrip.has_eltish && <Tag color="blue" icon={<InboxOutlined />}>Eltish: Yoqilgan</Tag>}
                    {activeTrip.has_yuk && <Tag color="orange" icon={<AppstoreAddOutlined />}>Yuk: Yoqilgan</Tag>}
                    {activeTrip.female_only && <Tag color="magenta" icon={<SafetyCertificateOutlined />}>Faqat ayollar uchun</Tag>}
                  </Space>
                )}
              </Space>
            </Col>
            <Col xs={24} sm={12} style={{ textAlign: 'right' }}>
              <Space>
                <Button icon={<ReloadOutlined />} onClick={() => window.location.reload()}>Yangilash</Button>
                <Button icon={<InboxOutlined />} disabled={!deliveryEnabled && !freightEnabled} onClick={() => setParcelOpen(true)}>Eltishlar</Button>
                <Button icon={<SettingOutlined />} onClick={() => setPitakAdminOpen(true)}>Sozlamalar</Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Asosiy ishchi qism */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={8}>
            <ModeSwitchToggle />
          </Col>
          <Col xs={24} lg={8}>
            <TripEarnings />
          </Col>
          <Col xs={24} lg={8}>
            <CarSeatVisualizer />
          </Col>

          {mode === MODES.STANDARD ? (
            <>
              <Col xs={24} lg={8}>
                <PitakQueueBoard />
              </Col>
              <Col xs={24} lg={8}>
                <FixedRouteCard />
              </Col>
              <Col xs={24} lg={8}>
                <PassengerListSimple />
              </Col>
            </>
          ) : (
            <>
              <Col xs={24} lg={8}>
                <ClientLocatorMap />
              </Col>
              <Col xs={24} lg={8}>
                <DoorToDoorNav />
              </Col>
              <Col xs={24} lg={8}>
                <DynamicPriceCard />
              </Col>
            </>
          )}
        </Row>

        {/* Modallar va Drawers */}
        <ParcelEntryModal 
          open={parcelOpen} 
          onClose={() => setParcelOpen(false)} 
          deliveryEnabled={deliveryEnabled}
          freightEnabled={freightEnabled}
          activeVehicle={activeVehicle}
        />
        
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
        
        <PitakAdminModal 
          open={pitakAdminOpen} 
          onClose={() => setPitakAdminOpen(false)} 
        />
        
        <TripRequestsDrawer 
          open={requestsOpen} 
          onClose={() => setRequestsOpen(false)} 
        />
      </Content>
    </Layout>
  );
}

/**
 * Main Export
 * Provider bilan o'ralgan holatda
 */
export default function InterDistrictPage() {
  return (
    <DistrictProvider>
      <Inner />
    </DistrictProvider>
  );
}