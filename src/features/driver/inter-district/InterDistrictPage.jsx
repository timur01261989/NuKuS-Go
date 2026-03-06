import React, { useMemo, useState, useCallback } from 'react';
import { Layout, Row, Col, Space, Typography, Button, message, Switch, Tooltip } from 'antd';
import { ReloadOutlined, InboxOutlined } from '@ant-design/icons';

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

import './styles/theme.css';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

function Inner() {
  const { mode, MODES, upsertPremiumClient, lastError, locateOnce } = useDistrict();
  const [parcelOpen, setParcelOpen] = useState(false);
  const [tripCreateOpen, setTripCreateOpen] = useState(false);
  const [pitakAdminOpen, setPitakAdminOpen] = useState(false);
  const [requestsOpen, setRequestsOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(() => {
    try { return localStorage.getItem('inter_district_driver_online') === '1'; } catch { return false; }
  });

  // Premium: realtime requestlar
  usePremiumSocket({
    enabled: mode === MODES.PREMIUM,
    onRequest: (req) => upsertPremiumClient(req),
  });

  const themeClass = useMemo(() => 'theme-blue', []);

  const onRefresh = useCallback(() => {
    locateOnce();
    message.success('Yangilandi');
  }, [locateOnce]);

  return (
    <Layout className={`inter-district-root ${themeClass}`} style={{ minHeight: '100vh' }}>
      <Header className="inter-district-header">
        <Space style={{ width: '100%', justifyContent: 'space-between' }} align="center">
          <div>
            <Title level={4} style={{ margin: 0, color: 'var(--theme-text)' }}>
              Tumanlararo Haydovchi
            </Title>
            <Text style={{ color: 'var(--theme-subtext)' }}>
              Rejim: {mode === MODES.PREMIUM ? 'Premium (Eshikdan-Eshikgacha)' : 'Standart (Pitak)'}
            </Text>
          </div>
          <Space>
            <Tooltip title="Online bo‘lsangiz, reys yaratishingiz va so‘rovlarni qabul qilishingiz mumkin">
              <Space align="center" size={6}>
                <Text style={{ color: 'var(--theme-subtext)' }}>Online</Text>
                <Switch
                  checked={isOnline}
                  onChange={(v) => {
                    setIsOnline(v);
                    try { localStorage.setItem('inter_district_driver_online', v ? '1' : '0'); } catch {}
                    if (v) locateOnce();
                  }}
                />
              </Space>
            </Tooltip>
            <Button icon={<InboxOutlined />} onClick={() => setParcelOpen(true)}>
              Posilka
            </Button>

            <Button onClick={() => setRequestsOpen(true)} disabled={!isOnline}>
              So‘rovlar
            </Button>
            <Button onClick={() => setTripCreateOpen(true)} type="primary" disabled={!isOnline}>
              Reys yaratish
            </Button>
            <Button onClick={() => setPitakAdminOpen(true)}>
              Pitak (admin)
            </Button>
            <Button icon={<ReloadOutlined />} onClick={onRefresh}>
              Refresh
            </Button>
          </Space>
        </Space>
      </Header>

      <Content style={{ padding: 16 }}>
        {lastError ? (
          <div style={{ marginBottom: 12, padding: 10, background: '#fff1f0', border: '1px solid #ffa39e', borderRadius: 12 }}>
            <Text type="danger">Xatolik: {lastError}</Text>
          </div>
        ) : null}

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

        <ParcelEntryModal open={parcelOpen} onClose={() => setParcelOpen(false)} />
      </Content>

      <TripCreateModal open={tripCreateOpen} onClose={() => setTripCreateOpen(false)} isOnline={isOnline} />
      <PitakAdminModal open={pitakAdminOpen} onClose={() => setPitakAdminOpen(false)} />
      <TripRequestsDrawer open={requestsOpen} onClose={() => setRequestsOpen(false)} />
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
