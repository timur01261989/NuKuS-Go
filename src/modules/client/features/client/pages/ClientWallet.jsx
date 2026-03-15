import React, { memo, useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UnigoBottomNav, UnigoButton, UnigoCard, UnigoEmptyState, UnigoHeader, UnigoInput, UnigoKpiGrid, UnigoListRow, UnigoMapPanel, UnigoScreen, UnigoSection, UnigoSelect, UnigoServiceTile, UnigoStatusPill, UnigoToggle } from '@/modules/shared/ui/UnigoMobileUI.jsx';

function ClientWallet() {
  const navigate = useNavigate();
  const navItems = useMemo(() => ([
    { to: '/', icon: 'home', label: 'Asosiy' },
    { to: '/orders', icon: 'receipt_long', label: 'Buyurtmalar' },
    { to: '/wallet', icon: 'account_balance_wallet', label: 'Hamyon', active: true },
    { to: '/profile', icon: 'person', label: 'Profil' },
  ]), []);

  return (
    <UnigoScreen>
      <UnigoHeader back="/" title="Hamyon" subtitle="Balans, to‘ldirish va tranzaksiyalar" rightActions={[{ icon: 'history', label: 'Tarix', onClick: () => navigate('/orders') }]} />
      <UnigoCard>
        <div className="unigo-card__stack">
          <span className="unigo-pill unigo-pill--orange">Joriy balans</span>
          <h2 className="unigo-card-title" style={{ fontSize: 30 }}>225 000 so‘m</h2>
          <p className="unigo-card-caption">To‘lovlar va bonuslar shu hisobda jamlanadi.</p>
        </div>
      </UnigoCard>
      <div className="unigo-buttons" style={{ marginTop: 20 }}>
        <UnigoButton icon="add_card">Pul qo‘shish</UnigoButton>
        <UnigoButton variant="secondary" icon="sync">Balansni yangilash</UnigoButton>
      </div>
      <UnigoSection title="Oxirgi harakatlar">
        <div className="unigo-list">
          <UnigoListRow icon="savings" title="Pul qo‘shildi" description="Bugun, 10:24" value="+100 000" />
          <UnigoListRow icon="local_taxi" title="Taksi to‘lovi" description="Kecha, 20:10" value="-18 500" />
        </div>
      </UnigoSection>
      <UnigoSection>
        <UnigoEmptyState title="Hozircha to‘liq tarix yo‘q" description="Balansga pul qo‘shganingizdan keyin barcha tranzaksiyalar shu yerda chiqadi." />
      </UnigoSection>
      <UnigoBottomNav items={navItems} />
    </UnigoScreen>
  );
}

export default memo(ClientWallet);
