import React, { useState, useEffect } from 'react';
import { Card, List, Avatar, Typography, Tag, Button, Segmented, Skeleton } from 'antd';
import { 
  TrophyFilled, StarFilled, ArrowLeftOutlined, 
  ThunderboltFilled, CrownFilled 
} from '@ant-design/icons';
import { supabase } from "../lib/supabase";

const { Title, Text } = Typography;

export default function Leaderboard({ onBack }) {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Faollik'); // Filtrlash: Faollik yoki Safarlar

  useEffect(() => {
    fetchLeaderboard();
  }, [filter]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    const orderBy = filter === 'Faollik' ? 'activity_points' : 'rating_count';

    const { data, error } = await supabase
      .from('drivers')
      .select('id, first_name, avatar_url, activity_points, average_rating, car_model')
      .order(orderBy, { ascending: false })
      .limit(10);

    if (data) setDrivers(data);
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', background: '#f8f9fa', minHeight: '100vh' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={onBack} shape="circle" border="none" />
        <Title level={4} style={{ margin: '0 0 0 15px', fontFamily: 'YangoHeadline' }}>Reyting</Title>
      </div>

      {/* TOP 1 KARTA */}
      {!loading && drivers.length > 0 && (
        <Card style={{ 
          borderRadius: 24, background: 'linear-gradient(135deg, #FFD700 0%, #faad14 100%)', 
          textAlign: 'center', border: 'none', marginBottom: 20, boxShadow: '0 10px 20px rgba(250,173,20,0.3)' 
        }}>
          <CrownFilled style={{ fontSize: 40, color: '#fff', marginBottom: 10 }} />
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <Avatar size={80} src={drivers[0].avatar_url} style={{ border: '4px solid #fff' }} />
            <Tag color="black" style={{ position: 'absolute', bottom: -10, left: '50%', transform: 'translateX(-50%)', borderRadius: 10, fontWeight: 'bold' }}>#1</Tag>
          </div>
          <Title level={3} style={{ margin: '15px 0 5px', color: '#000' }}>{drivers[0].first_name}</Title>
          <Text strong style={{ color: 'rgba(0,0,0,0.6)' }}>{drivers[0].car_model}</Text>
        </Card>
      )}

      {/* FILTR */}
      <Segmented 
        block 
        options={['Faollik', 'Safarlar']} 
        value={filter} 
        onChange={setFilter} 
        style={{ marginBottom: 20, borderRadius: 12, padding: 4 }}
      />

      {/* RO'YXAT */}
      {loading ? <Skeleton active avatar paragraph={{ rows: 5 }} /> : (
        <List
          dataSource={drivers}
          renderItem={(driver, index) => (
            <Card 
              style={{ borderRadius: 16, marginBottom: 10, border: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}
              bodyStyle={{ padding: '12px 15px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                  <Text strong style={{ width: 20, fontSize: 16, color: index < 3 ? '#faad14' : '#ccc' }}>
                    {index + 1}
                  </Text>
                  <Avatar src={driver.avatar_url} size="large" />
                  <div>
                    <Text strong style={{ display: 'block' }}>{driver.first_name}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>{driver.car_model}</Text>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Tag color={filter === 'Faollik' ? 'orange' : 'blue'} icon={filter === 'Faollik' ? <ThunderboltFilled /> : <StarFilled />} style={{ borderRadius: 6 }}>
                    {filter === 'Faollik' ? driver.activity_points : driver.average_rating}
                  </Tag>
                </div>
              </div>
            </Card>
          )}
        />
      )}
    </div>
  );
}