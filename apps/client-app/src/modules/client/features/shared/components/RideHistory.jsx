import React, { useEffect, useState } from 'react';
import { List, Card, Typography, Tag, Button, Spin, Empty } from 'antd';
import { ClockCircleOutlined, EnvironmentFilled, ArrowLeftOutlined, RightOutlined } from '@ant-design/icons';
import { supabase } from '@/services/supabase/supabaseClient';
import { useLanguage } from '@/modules/shared/i18n/useLanguage';
import { supportAssets } from '@/assets/support';
import { assetStyles } from '@/assets/assetPolish';

const { Title, Text } = Typography;


function resolveServiceIcon(item) {
  const type = String(item?.service_type || item?.service || item?.category || "").toLowerCase();
  if (type.includes("truck") || type.includes("freight")) return supportAssets.services.truckLive || supportAssets.services.truck;
  if (type.includes("wash")) return supportAssets.services.washBooking || supportAssets.services.wash;
  if (type.includes("station") || type.includes("fuel")) return supportAssets.services.stationLive || supportAssets.services.station;
  return supportAssets.history.receiptOrder || supportAssets.history.receipt;
}


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
          .eq("user_id", userId)
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 12 }}><img src={supportAssets.history.receiptOrder || supportAssets.history.receipt} alt='' style={assetStyles.historyAction} /><Title level={4} style={{ margin: 0, fontFamily: 'AccentHeadline' }}>{tr('rideHistory.title', 'Safarlar tarixi')}</Title></div>
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
              styles={{ body: { padding: '15px 20px' } }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                   <ClockCircleOutlined /> {formatDate(item.created_at)}
                </Text>
                <Tag color={item.status === 'completed' ? 'green' : 'red'} style={{ borderRadius: 6, margin: 0 }}>
                  {item.status === 'completed' ? tr('rideHistory.completed', 'Yakunlandi') : tr('rideHistory.cancelled', 'Bekor qilingan')}
                </Tag>
              </div>

              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom: 12 }}><img src={resolveServiceIcon(item)} alt='' style={assetStyles.orderServiceIcon} /><Text strong>{item.service_type || item.service || tr('rideHistory.ride', 'Safar')}</Text></div>

              {/* MARSHRUT VIZUALIZATSIYASI */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 15 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, marginTop: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FFD700' }} />
                  <div style={{ width: 1, height: 20, background: '#eee' }} />
                  <EnvironmentFilled style={{ color: '#ff4d4f', fontSize: 12 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <Text strong style={{ display: 'block', fontSize: 14, fontFamily: 'AccentHeadline' }}>
                    {item.pickup?.address || item.pickup_address || tr('rideHistory.startPoint', "Boshlang'ich nuqta")}
                  </Text>
                  <div style={{ height: 12 }} />
                  <Text strong style={{ display: 'block', fontSize: 14, fontFamily: 'AccentHeadline' }}>
                    {item.dropoff?.address || item.destination_address || tr("rideHistory.destinationReached", "Manzilga yetib borildi")}
                  </Text>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                   <Text type="secondary" style={{ fontSize: 12 }}>{tr('rideHistory.tripPrice', 'Safar narxi:')}</Text>
                   <div style={{ fontSize: 18, fontWeight: 'bold', fontFamily: 'AccentHeadline' }}>
                     {Number(item.price_uzs || item.price || 0).toLocaleString()} {tr('common.sum', "so'm")}
                   </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}><Button type="text" icon={<img src={supportAssets.history.receipt} alt='' style={assetStyles.historyAction} />} /><Button type="text" icon={<img src={supportAssets.history.share} alt='' style={assetStyles.historyAction} />} /><Button type="text" icon={<img src={supportAssets.support.mainAlt || supportAssets.support.main} alt='' style={assetStyles.historyAction} />} /></div>
              </div>
            </Card>
          )}
        />
      )}
    </div>
  );
}