import React, { useEffect, useMemo, useState } from 'react';
import { Card, Typography, ConfigProvider, Row, Col, Button, Switch, message, Badge, Spin } from 'antd';
import { CarOutlined, DropboxOutlined, RocketOutlined, GlobalOutlined, EnvironmentOutlined, ArrowLeftOutlined, PoweroffOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/services/supabase/supabaseClient';
import { fetchDriverCore } from '@/modules/shared/auth/driverCoreAccess';
import { useLanguage } from '@/modules/shared/i18n/useLanguage.js';
import { safeBack } from '@/modules/shared/navigation/safeBack';

const { Title, Text } = Typography;

const LABELS = {
  taxi: 'Taksi',
  delivery: 'Eltish',
  freight: 'Yuk tashish',
  inter_district: 'Tumanlar aro',
  inter_city: 'Viloyatlar aro',
};

export default function DriverServiceSelect({ onSelectService }) {
  const navigate = useNavigate();
  const { currentLanguageMeta } = useLanguage();
  const [isOnline, setIsOnline] = useState(false);
  const [allowedServices, setAllowedServices] = useState([]);
  const [maxFreight, setMaxFreight] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        const userId = auth?.user?.id;
        if (!userId) return;

        const [core, { data: presence }] = await Promise.all([
          fetchDriverCore(userId),
          supabase.from('driver_presence').select('is_online').eq('driver_id', userId).maybeSingle(),
        ]);

        setAllowedServices(Array.isArray(core?.allowedServices) ? core.allowedServices : []);
        setMaxFreight(Number(core?.activeVehicle?.max_weight_kg || 0));
        setIsOnline(!!presence?.is_online);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const services = useMemo(() => {
    const map = {
      inter_city: { key: 'inter_city', title: LABELS.inter_city, icon: <GlobalOutlined />, bg: '#e6f7ff', color: '#1890ff' },
      inter_district: { key: 'inter_district', title: LABELS.inter_district, icon: <EnvironmentOutlined />, bg: '#f6ffed', color: '#52c41a' },
      freight: { key: 'freight', title: maxFreight > 0 ? `${LABELS.freight} (0-${Math.round(maxFreight)} kg)` : LABELS.freight, icon: <DropboxOutlined />, bg: '#fff7e6', color: '#fa8c16' },
      delivery: { key: 'delivery', title: LABELS.delivery, icon: <RocketOutlined />, bg: '#fff1f0', color: '#f5222d' },
      taxi: { key: 'taxi', title: LABELS.taxi, icon: <CarOutlined />, bg: '#f9f0ff', color: '#722ed1' },
    };
    return allowedServices.map((key) => map[key]).filter(Boolean);
  }, [allowedServices, maxFreight]);

  const toggleOnline = async (checked) => {
    setIsOnline(checked);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id;
      if (!userId) return;
      await supabase.from('driver_presence').upsert([{ driver_id: userId, is_online: checked, state: checked ? 'online' : 'offline', updated_at: new Date().toISOString(), last_seen_at: new Date().toISOString() }], { onConflict: 'driver_id' });
      message.success(checked ? 'Online rejim yoqildi' : 'Offline rejim yoqildi');
    } catch (e) {
      message.error(e?.message || 'Holatni yangilab bo‘lmadi');
    }
  };

  const renderCard = (service) => (
    <Col xs={24} sm={12} key={service.key}>
      <Card hoverable onClick={() => isOnline ? onSelectService(service.key) : message.error('Avval online bo‘ling')} style={{ borderRadius: 24, border: 'none', background: isOnline ? service.bg : '#f5f5f5', opacity: isOnline ? 1 : 0.7, height: 160 }} bodyStyle={{ padding: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{ fontSize: 30, color: isOnline ? service.color : '#bfbfbf', marginBottom: 14 }}>{service.icon}</div>
        <Text strong style={{ fontSize: 16, textAlign: 'center' }}>{service.title}</Text>
      </Card>
    </Col>
  );

  return (
    <ConfigProvider>
      <div style={{ minHeight: '100vh', background: '#fff', padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <Button icon={<ArrowLeftOutlined />} shape="circle" size="large" onClick={() => safeBack(navigate, '/driver')} />
          <div style={{ background: '#f0f0f0', padding: '6px 16px', borderRadius: 20, fontWeight: 'bold', fontSize: 14 }}>{currentLanguageMeta.shortLabel}</div>
        </div>

        <Card style={{ marginBottom: 24, borderRadius: 24 }} bodyStyle={{ padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Badge status={isOnline ? 'success' : 'default'} />
              <Title level={4} style={{ margin: 0 }}>{isOnline ? 'Online' : 'Offline'}</Title>
            </div>
            <Text type="secondary">Faqat sizga ruxsat berilgan xizmatlar ko‘rsatiladi.</Text>
          </div>
          <Switch checked={isOnline} onChange={toggleOnline} checkedChildren={<CarOutlined />} unCheckedChildren={<PoweroffOutlined />} style={{ transform: 'scale(1.25)' }} />
        </Card>

        <Title level={3}>Xizmat tanlang</Title>
        {loading ? <div style={{ padding: 30, textAlign: 'center' }}><Spin /></div> : <Row gutter={[16, 16]}>{services.map(renderCard)}</Row>}
      </div>
    </ConfigProvider>
  );
}
