import React, { memo, useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UnigoBottomNav, UnigoButton, UnigoCard, UnigoEmptyState, UnigoHeader, UnigoInput, UnigoKpiGrid, UnigoListRow, UnigoMapPanel, UnigoScreen, UnigoSection, UnigoSelect, UnigoServiceTile, UnigoStatusPill, UnigoToggle } from '@/modules/shared/ui/UnigoMobileUI.jsx';

function ClientProfile() {
  const navigate = useNavigate();
  const navItems = useMemo(() => ([
    { to: '/', icon: 'home', label: 'Asosiy' },
    { to: '/orders', icon: 'receipt_long', label: 'Buyurtmalar' },
    { to: '/wallet', icon: 'account_balance_wallet', label: 'Hamyon' },
    { to: '/profile', icon: 'person', label: 'Profil', active: true },
  ]), []);

  return (
    <UnigoScreen>
      <UnigoHeader back="/" title="Profil" subtitle="Hisob va shaxsiy ma’lumotlar" />
      <UnigoCard>
        <div className="unigo-card__row">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="unigo-avatar">TA</div>
            <div className="unigo-card__stack" style={{ gap: 4 }}>
              <h2 className="unigo-card-title" style={{ fontSize: 22 }}>Temur Abdiev</h2>
              <p className="unigo-card-caption">Faol foydalanuvchi</p>
            </div>
          </div>
          <UnigoStatusPill variant="success">Faol</UnigoStatusPill>
        </div>
      </UnigoCard>
      <UnigoSection title="Hisob bo‘limlari">
        <div className="unigo-list">
          <UnigoListRow icon="person_edit" title="Profil ma’lumotlari" description="Ism, telefon, rasm" onClick={() => navigate('/profile/details')} />
          <UnigoListRow icon="group_add" title="Do‘stlarni taklif qilish" description="Kod va havola orqali bonus oling" onClick={() => navigate('/referral')} />
          <UnigoListRow icon="confirmation_number" title="Promo kodlar" description="Chegirma va aksiyalar" onClick={() => navigate('/promo')} />
          <UnigoListRow icon="settings" title="Sozlamalar" description="Til, tungi rejim va bildirishnomalar" onClick={() => navigate('/settings')} />
          <UnigoListRow icon="logout" title="Chiqish" description="Hisobdan xavfsiz chiqish" danger onClick={() => navigate('/login')} />
        </div>
      </UnigoSection>
      <UnigoBottomNav items={navItems} />
    </UnigoScreen>
  );
}

export default memo(ClientProfile);
