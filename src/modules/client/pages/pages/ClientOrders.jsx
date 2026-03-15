import React, { memo, useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UnigoBottomNav, UnigoButton, UnigoCard, UnigoEmptyState, UnigoHeader, UnigoInput, UnigoKpiGrid, UnigoListRow, UnigoMapPanel, UnigoScreen, UnigoSection, UnigoSelect, UnigoServiceTile, UnigoStatusPill, UnigoToggle } from '@/modules/shared/ui/UnigoMobileUI.jsx';

function ClientOrders() {
  const navigate = useNavigate();
  const navItems = useMemo(() => ([
    { to: '/', icon: 'home', label: 'Asosiy' },
    { to: '/orders', icon: 'receipt_long', label: 'Buyurtmalar', active: true },
    { to: '/wallet', icon: 'account_balance_wallet', label: 'Hamyon' },
    { to: '/profile', icon: 'person', label: 'Profil' },
  ]), []);

  return (
    <UnigoScreen>
      <UnigoHeader back="/" title="Buyurtmalar" subtitle="Aktiv va tugallangan buyurtmalar" />
      <UnigoSection title="Joriy buyurtmalar">
        <div className="unigo-list">
          <UnigoListRow icon="local_taxi" title="Taksi buyurtmasi" description="Aeroport yo‘nalishi • Jarayonda" value="36 000" onClick={() => navigate('/taxi')} />
          <UnigoListRow icon="package_2" title="Eltish buyurtmasi" description="Shahar ichi • Kutilmoqda" value="18 000" onClick={() => navigate('/delivery')} />
        </div>
      </UnigoSection>
      <UnigoSection title="Buyurtma tarixi">
        <div className="unigo-list">
          <UnigoListRow icon="local_shipping" title="Yuk tashish" description="Bajarilgan • 14-mart" value="95 000" onClick={() => navigate('/freight')} />
          <UnigoListRow icon="travel_explore" title="Viloyatlar aro" description="Bekor qilingan • 12-mart" value="52 000" onClick={() => navigate('/intercity')} />
        </div>
      </UnigoSection>
      <UnigoBottomNav items={navItems} />
    </UnigoScreen>
  );
}

export default memo(ClientOrders);
