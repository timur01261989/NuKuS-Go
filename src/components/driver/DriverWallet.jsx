import React, { useState, useEffect } from 'react';
import { Card, Typography, Row, Col, Button, List, Tag, Statistic, message, Modal } from 'antd';
import { 
  ArrowLeftOutlined, WalletOutlined, ArrowUpOutlined, 
  ArrowDownOutlined, BankOutlined, HistoryOutlined 
} from '@ant-design/icons';
import { supabase } from '../../pages/supabase';

const { Title, Text } = Typography;

export default function DriverWallet({ onBack }) {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // 1. Joriy balansni olish
      const { data: driver } = await supabase.from('drivers').select('balance').eq('id', user.id).single();
      if (driver) setBalance(driver.balance);

      // 2. Tranzaksiyalarni olish
      const { data: txs } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('driver_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (txs) setTransactions(txs);
    }
    setLoading(false);
  };

  const handleWithdraw = () => {
    if (balance < 10000) {
      message.warning("Minimal yechish miqdori 10 000 so'm");
      return;
    }
    Modal.confirm({
      title: 'Pul yechish',
      content: `${balance.toLocaleString()} so'm kartangizga o'tkazilsinmi?`,
      onOk: () => message.success("So'rov qabul qilindi, 24 soat ichida tushadi.")
    });
  };

  return (
    <div style={{ padding: '20px', background: '#f8f9fa', minHeight: '100vh' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={onBack} type="text" size="large" />
        <Title level={4} style={{ margin: '0 0 0 10px', fontFamily: 'YangoHeadline' }}>Hamyon</Title>
      </div>

      {/* BALANS KARTASI */}
      <Card style={{ 
        borderRadius: 24, 
        background: 'linear-gradient(135deg, #000 0%, #333 100%)', 
        color: '#fff',
        boxShadow: '0 15px 30px rgba(0,0,0,0.15)',
        border: 'none',
        marginBottom: 25
      }}>
        <Statistic 
          title={<Text style={{ color: 'rgba(255,255,255,0.6)' }}>Asosiy balans</Text>}
          value={balance} 
          precision={0}
          suffix="so'm"
          valueStyle={{ color: '#FFD700', fontSize: 32, fontWeight: 900 }}
        />
        <Button 
          block 
          size="large" 
          icon={<BankOutlined />}
          onClick={handleWithdraw}
          style={{ 
            marginTop: 20, 
            height: 55, 
            borderRadius: 15, 
            background: '#FFD700', 
            border: 'none', 
            fontWeight: 'bold',
            color: '#000'
          }}
        >
          KARTAGA YECHISH
        </Button>
      </Card>

      {/* TRANZAKSIYALAR TARIXI */}
      <Title level={5}><HistoryOutlined /> Oxirgi harakatlar</Title>
      <List
        loading={loading}
        dataSource={transactions}
        renderItem={item => (
          <Card style={{ borderRadius: 16, marginBottom: 10, border: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                <div style={{ 
                  width: 40, height: 40, borderRadius: '50%', 
                  background: item.type === 'income' ? '#e6f7ed' : '#fff1f0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {item.type === 'income' ? <ArrowDownOutlined style={{color: '#52c41a'}} /> : <ArrowUpOutlined style={{color: '#ff4d4f'}} />}
                </div>
                <div>
                  <Text strong style={{ display: 'block' }}>{item.description}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>{new Date(item.created_at).toLocaleDateString()}</Text>
                </div>
              </div>
              <Text strong style={{ color: item.type === 'income' ? '#52c41a' : '#ff4d4f' }}>
                {item.type === 'income' ? '+' : '-'}{item.amount.toLocaleString()}
              </Text>
            </div>
          </Card>
        )}
      />
    </div>
  );
}