import React from 'react';
import { Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { usePageI18n } from '../pageI18n';
import { GarageModule } from '../../features/garage/GarageModule.jsx';

export default function GaragePage() {
  const nav = useNavigate();
  const { tx } = usePageI18n();
  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', padding: 16 }}>
      <div style={{ display:'flex', alignItems:'center', gap: 12, marginBottom: 12 }}>
        <Button icon={<ArrowLeftOutlined />} shape="circle" onClick={() => nav(-1)} aria-label={tx("backAria", "Back")} />
        <div style={{ fontWeight: 800 }}>{tx("garage", "Garage")}</div>
      </div>
      <GarageModule />
    </div>
  );
}
