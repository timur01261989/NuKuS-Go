import React from 'react';
import { Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { PaymentsModule } from '../../features/payments/PaymentsModule.jsx';

export default function PaymentsPage() {
  const nav = useNavigate();
  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', padding: 16 }}>
      <div style={{ display:'flex', alignItems:'center', gap: 12, marginBottom: 12 }}>
        <Button icon={<ArrowLeftOutlined />} shape="circle" onClick={() => nav(-1)} />
        <div style={{ fontWeight: 800 }}>Payments</div>
      </div>
      <PaymentsModule />
    </div>
  );
}
