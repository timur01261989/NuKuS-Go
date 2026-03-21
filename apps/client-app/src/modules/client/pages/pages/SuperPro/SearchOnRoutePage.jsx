import React from 'react';
import { Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { usePageI18n } from '../pageI18n';
import { SearchOnRouteModule } from '@/modules/client/features/searchOnRoute/SearchOnRouteModule.jsx';

export default function SearchOnRoutePage() {
  const nav = useNavigate();
  const { tx } = usePageI18n();
  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', padding: 16 }}>
      <div style={{ display:'flex', alignItems:'center', gap: 12, marginBottom: 12 }}>
        <Button icon={<ArrowLeftOutlined />} shape="circle" onClick={() => nav(-1)} aria-label={tx("backAria", "Back")} />
        <div style={{ fontWeight: 800 }}>{tx("searchOnRoute", "Yo‘lda qidirish")}</div>
      </div>
      <SearchOnRouteModule />
    </div>
  );
}
