import React, { useState, useEffect } from 'react';
import { List, Card, Typography, Tag, Button, Skeleton, Empty } from 'antd';
import { 
  ArrowLeftOutlined, EnvironmentOutlined, 
  ClockCircleOutlined, CarOutlined, CustomerServiceOutlined 
} from '@ant-design/icons';
import { supabase } from '@/lib/supabase';

const { Text, Title } = Typography;

export default function TripHistory({ onBack }) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('passenger_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (data) setTrips(data);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', background: '#f8f9fa', minHeight: '100vh' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 25 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={onBack} shape="circle" border="none" />
        <Title level={4} style={{ margin: '0 0 0 15px', fontFamily: 'YangoHeadline' }}>Sayohatlar tarixi</Title>
      </div>

      {loading ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : trips.length === 0 ? (
        <Empty description="Sizda hali safarlar mavjud emas" style={{ marginTop: 100 }} />
      ) : (
        <List
          dataSource={trips}
          renderItem={trip => (
            <Card 
              style={{ borderRadius: 20, marginBottom: 15, border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}
              bodyStyle={{ padding: '15px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <Tag color="default" icon={<ClockCircleOutlined />}>
                  {new Date(trip.created_at).toLocaleDateString()}
                </Tag>
                <Text strong style={{ color: '#1890ff' }}>
                  {parseInt(trip.price).toLocaleString()} so'm
                </Text>
              </div>

              <div style={{ position: 'relative', paddingLeft: '20px' }}>
                <div style={{ position: 'absolute', left: 4, top: 6, bottom: 6, width: 2, background: '#ddd' }} />

                <div style={{ marginBottom: 10 }}>
                  <div style={{ width: 8, height: 8, background: '#52c41a', borderRadius: '50%', position: 'absolute', left: 1, top: 6 }} />
                  <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Qayerdan:</Text>
                  <Text strong>{trip.pickup_location?.split(',').slice(0, 2).join(',')}</Text>
                </div>

                <div>
                  <div style={{ width: 8, height: 8, background: '#ff4d4f', borderRadius: 2, position: 'absolute', left: 1, bottom: 12 }} />
                  <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Qayerga:</Text>
                  <Text strong>{trip.dropoff_location?.split(',').slice(0, 2).join(',') || 'Xaritadan tanlangan'}</Text>
                </div>
              </div>

              <div style={{ marginTop: 15, paddingTop: 10, borderTop: '1px solid #f0f0f0', display: 'flex', alignItems: 'center' }}>
                <CarOutlined style={{ marginRight: 8, color: '#888' }} />
                <Text type="secondary" style={{ fontSize: 13 }}>Taksi xizmati</Text>
              
              <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                <Button
                  type="default"
                  icon={<CustomerServiceOutlined />}
                  style={{ borderRadius: 12, flex: 1 }}
                  onClick={() => { window.location.href = `/client/support/${trip.id}`; }}
                >
                  Support
                </Button>
              </div>
</div>
            </Card>
          )}
        />
      )}
    </div>
  );
}
import { haversineKm } from "../shared/geo/haversine";
import { nominatimReverse as _nominatimReverse } from "../shared/geo/nominatim";
