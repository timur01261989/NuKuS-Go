import React, { memo, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/modules/shared/auth/AuthProvider.jsx';
import { UnigoBottomNav, UnigoButton, UnigoCard, UnigoEmptyState, UnigoHeader, UnigoInput, UnigoKpiGrid, UnigoListRow, UnigoMapPanel, UnigoScreen, UnigoSection, UnigoSelect, UnigoServiceTile, UnigoStatusPill, UnigoToggle } from '@/modules/shared/ui/UnigoMobileUI.jsx';

function DriverHomePage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [online, setOnline] = useState(Boolean(auth?.driverApproved));
  const avatarLabel = String(auth?.profile?.full_name || auth?.profile?.phone || auth?.user?.phone || 'D').trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0] || '').join('').toUpperCase().slice(0, 2) || 'D';
  const navItems = useMemo(() => ([
    { to: '/driver', icon: 'home', label: 'Asosiy', active: true },
    { to: '/driver/orders', icon: 'receipt_long', label: 'Buyurtma tarixi' },
    { to: '/driver/settings', icon: 'settings', label: 'Sozlamalar' },
  ]), []);

  return (
    <UnigoScreen dark>
      <UnigoHeader
        dark
        avatarLabel={avatarLabel}
        title="Haydovchi paneli"
        subtitle="Bugungi ish holati va faol xizmatlar"
        onAvatarClick={() => navigate('/driver/profile')}
        rightActions={[
          { icon: 'notifications', label: 'Bildirishnomalar', onClick: () => navigate('/driver/orders') },
          { icon: 'add', label: 'Qo‘shish', onClick: () => navigate('/driver/vehicles') },
        ]}
      />
      <UnigoCard dark>
        <div className="unigo-card__row">
          <div className="unigo-card__stack">
            <span className="unigo-pill unigo-pill--success">Joriy holat</span>
            <h2 className="unigo-card-title" style={{ fontSize: 26, color: 'white' }}>{online ? 'Onlayn' : 'Oflayn'}</h2>
            <p className="unigo-card-caption unigo-card-caption--dark">{online ? 'Buyurtmalarni qabul qilishga tayyorsiz.' : 'Onlayn bo‘lsangiz buyurtmalar ko‘rinadi.'}</p>
          </div>
          <UnigoToggle checked={online} onChange={setOnline} />
        </div>
      </UnigoCard>
      <UnigoSection title="Faol ko‘rsatkichlar">
        <UnigoKpiGrid dark items={[
          { label: 'Bugungi daromad', value: '—' },
          { label: 'Safarlar soni', value: '—' },
          { label: 'Aktiv navbat', value: '—' },
          { label: 'Holat', value: online ? 'Onlayn' : 'Oflayn' },
        ]} />
      </UnigoSection>
      <UnigoSection title="Faol xizmatlar">
        <div className="unigo-list">
          <UnigoListRow dark icon="local_taxi" title="Shahar ichida taksi" description="Asosiy safar oqimi" />
          <UnigoListRow dark icon="package_2" title="Eltish" description="Hujjat va kichik buyumlar" />
          <UnigoListRow dark icon="local_shipping" title="Yuk olaman" description="Yuk tashishga tayyor" />
        </div>
      </UnigoSection>
      <UnigoSection>
        <UnigoCard dark soft="">
          <div className="unigo-card__stack">
            <span className="unigo-pill unigo-pill--warning">Eslatma</span>
            <h3 className="unigo-card-title" style={{ fontSize: 18, color: 'white' }}>Profil va mashina ma’lumotlarini tekshiring</h3>
            <p className="unigo-card-caption unigo-card-caption--dark">Buyurtmalarni qabul qilishdan oldin aktiv mashina va xizmat turlari to‘g‘ri tanlangan bo‘lishi kerak.</p>
          </div>
        </UnigoCard>
      </UnigoSection>
      <UnigoBottomNav items={navItems} dark />
    </UnigoScreen>
  );
}

export default memo(DriverHomePage);
