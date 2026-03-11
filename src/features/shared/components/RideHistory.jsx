import React, { useEffect, useState } from 'react';
import { List, Card, Typography, Tag, Button, Spin, Empty } from 'antd';
import { ClockCircleOutlined, EnvironmentFilled, ArrowLeftOutlined, RightOutlined } from '@ant-design/icons';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/shared/i18n/useLanguage';

const { Title, Text } = Typography;

export default function RideHistory({ userId, role, onBack }) {
  const { tr, langKey } = useLanguage();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      let data = null;

      if (role === 'driver') {
        // Support schema variants: orders.driver_id or orders.driver_id
        let r = await supabase
          .from('orders')
          .select('*')
          .eq('driver_id', userId)
          .order('created_at', { ascending: false });

        if (r.error) {
          r = await supabase
            .from('orders')
            .select('*')
            .eq('driver_id', userId)
            .order('created_at', { ascending: false });
        }

        data = r.data || [];
      } else {
        const r = await supabase
          .from('orders')
          .select('*')
          .or(`user_id.eq.${userId},client_id.eq.${userId}`)
          .order('created_at', { ascending: false });

        data = r.data || [];
      }

      

      if (data) setHistory(data);
      setLoading(false);
    };

    fetchHistory();
  }, [userId, role]);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(langKey === 'ru' ? 'ru-RU' : langKey === 'en' ? 'en-US' : 'uz-UZ', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ padding: '20px', background: '#f8f9fa', minHeight: '100vh' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 25 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={onBack} type="text" shape="circle" />
        <Title level={4} style={{ margin: '0 0 0 15px', fontFamily: 'YangoHeadline' }}>{tr('rideHistory.title', 'Safarlar tarixi')}</Title>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', marginTop: 50 }}><Spin size="large" /></div>
      ) : history.length === 0 ? (
        <Empty description={tr('rideHistory.empty', "Hozircha safarlar yo'q")} />
      ) : (
        <List
          dataSource={history}
          renderItem={item => (
            <Card 
              style={{ borderRadius: 20, marginBottom: 15, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
              bodyStyle={{ padding: '15px 20px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                   <ClockCircleOutlined /> {formatDate(item.created_at)}
                </Text>
                <Tag color={item.status === 'completed' ? 'green' : 'red'} style={{ borderRadius: 6, margin: 0 }}>
                  {item.status === 'completed' ? tr('rideHistory.completed', 'Yakunlandi') : tr('rideHistory.cancelled', 'Bekor qilingan')}
                </Tag>
              </div>

              {/* MARSHRUT VIZUALIZATSIYASI */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 15 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, marginTop: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FFD700' }} />
                  <div style={{ width: 1, height: 20, background: '#eee' }} />
                  <EnvironmentFilled style={{ color: '#ff4d4f', fontSize: 12 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <Text strong style={{ display: 'block', fontSize: 14, fontFamily: 'YangoHeadline' }}>
                    {item.pickup?.address || item.pickup_address || tr('rideHistory.startPoint', "Boshlang'ich nuqta")}
                  </Text>
                  <div style={{ height: 12 }} />
                  <Text strong style={{ display: 'block', fontSize: 14, fontFamily: 'YangoHeadline' }}>
                    {item.dropoff?.address || item.destination_address || tr("rideHistory.destinationReached", "Manzilga yetib borildi")}
                  </Text>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                   <Text type="secondary" style={{ fontSize: 12 }}>{tr('rideHistory.tripPrice', 'Safar narxi:')}</Text>
                   <div style={{ fontSize: 18, fontWeight: 'bold', fontFamily: 'YangoHeadline' }}>
                     {Number(item.price_uzs || item.price || 0).toLocaleString()} {tr('common.sum', "so'm")}
                   </div>
                </div>
                <Button type="text" icon={<RightOutlined />} />
              </div>
            </Card>
          )}
        />
      )}
    </div>
  );
}