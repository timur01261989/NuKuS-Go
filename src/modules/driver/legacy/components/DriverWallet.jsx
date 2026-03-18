import React, { useState, useEffect } from 'react';
import { Card, Typography, Row, Col, Button, List, Tag, Statistic, message, Modal, Empty } from 'antd';
import { 
  ArrowLeftOutlined, WalletOutlined, ArrowUpOutlined, 
  ArrowDownOutlined, BankOutlined, HistoryOutlined 
} from '@ant-design/icons';
import { supabase } from "@/services/supabase/supabaseClient";
import { useDriverText } from "../shared/i18n_driverLocalize";

const { Title, Text } = Typography;

export default function DriverWallet({ onBack }) {
  const { cp } = useDriverText();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  // XATONI TO'G'IRLASH: Funksiya useEffect'dan oldin e'lon qilinishi shart
  const fetchWalletData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // 1. Joriy balansni olish
      const { data: wallet } = await supabase.from('wallets').select('balance_uzs').eq('user_id', user.id).maybeSingle();
      if (wallet) setBalance(wallet.balance_uzs ?? 0);

      // 2. Tranzaksiyalarni olish
      const { data: txs } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (txs) setTransactions(txs);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWalletData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleWithdraw = () => {
    if (balance < 10000) {
      message.warning(cp("Minimal yechish miqdori 10 000 so'm"));
      return;
    }
    Modal.confirm({
      title: cp('Pul yechish'),
      content: `${balance.toLocaleString()} so'm ${cp("kartangizga o'tkazilsinmi?")}`,
      onOk: () => message.success(cp("So'rov qabul qilindi, 24 soat ichida tushadi."))
    });
  };

  return (
    <div style={{ padding: '20px', background: '#f8f9fa', minHeight: '100vh' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={onBack} type="text" size="large" />
        <Title level={4} style={{ margin: '0 0 0 10px', fontFamily: 'AccentHeadline' }}>{cp('Hamyon')}</Title>
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
          title={<Text style={{ color: 'rgba(255,255,255,0.6)' }}>{cp('Asosiy balans')}</Text>}
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
      <Title level={5}><HistoryOutlined /> {cp('Oxirgi harakatlar')}</Title>
      <List
        loading={loading}
        dataSource={transactions}
        locale={{ emptyText: <Empty description={cp("Tranzaksiyalar yo'q")} /> }}
        renderItem={item => (
          <Card style={{ borderRadius: 16, marginBottom: 10, border: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                <div style={{ 
                  width: 40, height: 40, borderRadius: '50%', 
                  background: (item.type || (item.direction === 'credit' ? 'income' : 'expense')) === 'income' ? '#e6f7ed' : '#fff1f0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {(item.type || (item.direction === 'credit' ? 'income' : 'expense')) === 'income' ? <ArrowDownOutlined style={{color: '#52c41a'}} /> : <ArrowUpOutlined style={{color: '#ff4d4f'}} />}
                </div>
                <div>
                  <Text strong style={{ display: 'block' }}>{item.description}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>{new Date(item.created_at).toLocaleDateString()}</Text>
                </div>
              </div>
              <Text strong style={{ color: (item.type || (item.direction === 'credit' ? 'income' : 'expense')) === 'income' ? '#52c41a' : '#ff4d4f' }}>
                {(item.type || (item.direction === 'credit' ? 'income' : 'expense')) === 'income' ? '+' : '-'}{(item.amount ?? item.amount_uzs ?? 0).toLocaleString()}
              </Text>
            </div>
          </Card>
        )}
      />
    </div>
  );
}