import React, { useState, useEffect } from 'react';
import { useDriverText } from "../shared/i18n_driverLocalize";
import { Card, Avatar, Typography, Row, Col, Statistic, Button, List, Rate, Tag } from 'antd';
import {
  UserOutlined, CarOutlined, StarFilled,
  WalletOutlined, HistoryOutlined, SettingOutlined,
  LogoutOutlined, CameraOutlined, ArrowLeftOutlined,
  TrophyFilled
} from '@ant-design/icons';

// ✅ TO‘G‘RI IMPORT (siizda src/lib/supabase.js bor)
import { supabase } from '@/lib/supabase';

// Komponentlarni import qilish
import DriverWallet from './DriverWallet';
import ActivityChart from './ActivityChart';
import Leaderboard from './Leaderboard';

const { Title, Text } = Typography;

export default function DriverProfile({ onBack, onLogout }) {
  const { cp } = useDriverText();
  const [driverData, setDriverData] = useState(null);
  const [stats, setStats] = useState({ total_trips: 0, rating: 5.0 });
  const [walletOpen, setWalletOpen] = useState(false);
  const [userId, setUserId] = useState(null);

  // ✅ Reyting sahifasi
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);

  // XATONI TO'G'IRLASH: Funksiya useEffect'dan oldin e'lon qilinishi shart
  const fetchProfileData = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      setUserId(user.id);

      const { data } = await supabase
        .from('drivers')
        .select('first_name, car_model, car_color, plate_number, avatar_url, average_rating, rating_count')
        .eq('user_id', user.id)
        .single();

      if (data) setDriverData(data);

      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('driver_id', user.id)
        .eq('status', 'completed');

      setStats({
        total_trips: count || 0,
        rating: data?.average_rating || 5.0
      });
    }
  };

  useEffect(() => {
    fetchProfileData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Wallet ochilsa
  if (walletOpen) {
    return <DriverWallet onBack={() => setWalletOpen(false)} />;
  }

  // ✅ Leaderboard ochilsa
  if (leaderboardOpen) {
    return <Leaderboard onBack={() => setLeaderboardOpen(false)} />;
  }

  return (
    <div style={{ padding: '20px', background: '#f8f9fa', minHeight: '100vh' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={onBack} shape="circle" style={{ border: 'none' }} />
        <Title level={4} style={{ margin: 0, fontFamily: 'YangoHeadline' }}>{cp('Profil')}</Title>
        <Button icon={<SettingOutlined />} shape="circle" />
      </div>

      {/* ASOSIY KARTA */}
      <Card style={{ borderRadius: 24, textAlign: 'center', marginBottom: 20, border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <Avatar size={100} src={driverData?.avatar_url} icon={<UserOutlined />} style={{ border: '4px solid #FFD700' }} />
          <Button
            shape="circle"
            size="small"
            icon={<CameraOutlined />}
            style={{ position: 'absolute', bottom: 5, right: 5, background: '#FFD700', border: 'none' }}
          />
        </div>
        <Title level={3} style={{ marginTop: 15, marginBottom: 5 }}>{driverData?.first_name || cp('Haydovchi')}</Title>
        <Rate disabled value={stats.rating} allowHalf style={{ color: '#FFD700', fontSize: 14 }} />
        <Text type="secondary" style={{ display: 'block' }}>({driverData?.rating_count || 0} {cp('ta baho')})</Text>
      </Card>

      {/* STATISTIKA */}
      <Row gutter={15} style={{ marginBottom: 20 }}>
        <Col span={12}>
          <Card style={{ borderRadius: 20, textAlign: 'center', border: 'none' }}>
            <Statistic title={cp("Jami safarlar")} value={stats.total_trips} prefix={<HistoryOutlined />} />
          </Card>
        </Col>
        <Col span={12}>
          <Card style={{ borderRadius: 20, textAlign: 'center', border: 'none' }}>
            <Statistic title={cp("Reyting")} value={stats.rating} precision={1} prefix={<StarFilled style={{ color: '#FFD700' }} />} />
          </Card>
        </Col>
      </Row>

      {/* 📈 FAAOLLIK GRAFIGI */}
      {userId && <ActivityChart driverId={userId} />}

      <div style={{ marginBottom: 20 }} />

      {/* AVTOMOBIL MA'LUMOTLARI */}
      <Card title={<><CarOutlined /> {cp("Mashina ma'lumotlari")}</>} style={{ borderRadius: 20, marginBottom: 20, border: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <Text type="secondary">{cp("Model:")}</Text>
          <Text strong>{driverData?.car_model || '---'}</Text>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <Text type="secondary">{cp("Rangi:")}</Text>
          <Text strong>{driverData?.car_color || '---'}</Text>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Text type="secondary">{cp("Davlat raqami:")}</Text>
          <Tag color="black" style={{ fontSize: 14, fontWeight: 'bold' }}>{driverData?.plate_number || '---'}</Tag>
        </div>
      </Card>

      {/* MENU LIST */}
      <Card style={{ borderRadius: 20, border: 'none', marginBottom: 20 }}>
        <List itemLayout="horizontal">

          {/* ✅ REYTING SAHIFASINI OCHUVCHI ELEMENT */}
          <List.Item
            onClick={() => setLeaderboardOpen(true)}
            style={{ cursor: 'pointer' }}
          >
            <List.Item.Meta
              avatar={<TrophyFilled style={{ color: '#FFD700', fontSize: 22 }} />}
              title={<b>{cp("Top haydovchilar")}</b>}
              description={cp("Nukus Go reytingida o'z o'rningizni ko'ring")}
            />
          </List.Item>

          <List.Item onClick={() => setWalletOpen(true)} style={{ cursor: 'pointer' }}>
            <List.Item.Meta
              avatar={<WalletOutlined style={{ color: '#FFD700', fontSize: 20 }} />}
              title={<b>{cp("Hamyon va balans")}</b>}
              description={cp("Daromadlarni ko'rish va pul yechish")}
            />
          </List.Item>

          <List.Item style={{ cursor: 'pointer' }} onClick={onLogout}>
            <List.Item.Meta
              avatar={<LogoutOutlined style={{ color: 'red' }} />}
              title={<Text type="danger">{cp("Tizimdan chiqish")}</Text>}
            />
          </List.Item>

        </List>
      </Card>
    </div>
  );
}