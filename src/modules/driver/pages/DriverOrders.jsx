import React, { memo, useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UnigoBottomNav, UnigoButton, UnigoCard, UnigoEmptyState, UnigoHeader, UnigoInput, UnigoKpiGrid, UnigoListRow, UnigoMapPanel, UnigoScreen, UnigoSection, UnigoSelect, UnigoServiceTile, UnigoStatusPill, UnigoToggle } from '@/modules/shared/ui/UnigoMobileUI.jsx';

function DriverOrdersPage() {
  const navigate = useNavigate();
  const navItems = useMemo(() => ([
    { to: '/driver', icon: 'home', label: 'Asosiy' },
    { to: '/driver/orders', icon: 'receipt_long', label: 'Buyurtma tarixi', active: true },
    { to: '/driver/settings', icon: 'settings', label: 'Sozlamalar' },
  ]), []);
  return (
    <UnigoScreen dark>
      <UnigoHeader dark back="/driver" title="Buyurtma tarixi" subtitle="Aktiv, bajarilgan va bekor qilingan buyurtmalar" />
      <UnigoSection title="Bugungi buyurtmalar">
        <div className="unigo-list">
          <UnigoListRow dark icon="local_taxi" title="Shahar ichida taksi" description="Bajarilgan • 38 000 so‘m" value="4.8 km" />
          <UnigoListRow dark icon="package_2" title="Eltish" description="Jarayonda • 21 000 so‘m" value="Qabul qilingan" />
        </div>
      </UnigoSection>
      <UnigoSection>
        <UnigoEmptyState dark title="Arxiv bo‘limi soddalashtirildi" description="Bu ekranda oxirgi buyurtmalar, xizmat turi va holati bir xil kartalarda ko‘rsatiladi." />
      </UnigoSection>
      <UnigoBottomNav items={navItems} dark />
    </UnigoScreen>
  );
}

export default memo(DriverOrdersPage);
