import React, { memo, useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UnigoBottomNav, UnigoButton, UnigoCard, UnigoEmptyState, UnigoHeader, UnigoInput, UnigoKpiGrid, UnigoListRow, UnigoMapPanel, UnigoScreen, UnigoSection, UnigoSelect, UnigoServiceTile, UnigoStatusPill, UnigoToggle } from '@/modules/shared/ui/UnigoMobileUI.jsx';


const SERVICE_ITEMS = [
  { title: 'Viloyatlar aro', subtitle: 'Viloyatdan viloyatga qulay safar', icon: 'travel_explore', to: '/intercity', blue: true },
  { title: 'Tumanlar aro', subtitle: 'Tumanlar orasida yo‘l toping', icon: 'alt_route', to: '/interdistrict' },
  { title: 'Yuk tashish', subtitle: 'Yukingiz uchun mos transport', icon: 'local_shipping', to: '/freight', blue: true },
  { title: 'Eltish xizmati', subtitle: 'Hujjat va buyumlarni topshiring', icon: 'package_2', to: '/delivery' },
];

function ClientHome() {
  const navigate = useNavigate();
  const navItems = useMemo(() => ([
    { to: '/', icon: 'home', label: 'Asosiy', active: true },
    { to: '/orders', icon: 'receipt_long', label: 'Buyurtmalar' },
    { to: '/wallet', icon: 'account_balance_wallet', label: 'Hamyon' },
    { to: '/profile', icon: 'person', label: 'Profil' },
  ]), []);

  return (
    <UnigoScreen>
      <UnigoHeader
        avatarLabel="TA"
        title="Assalomu alaykum"
        subtitle="Bugun qayerga boramiz?"
        onAvatarClick={() => navigate('/profile')}
        rightActions={[
          { icon: 'notifications', label: 'Bildirishnomalar', onClick: () => navigate('/profile') },
          { icon: 'menu', label: 'Menyu', onClick: () => navigate('/profile') },
        ]}
      />

      <UnigoCard>
        <div className="unigo-hero">
          <div className="unigo-card__stack" style={{ justifyContent: 'space-between' }}>
            <div className="unigo-card__stack">
              <span className="unigo-pill unigo-pill--orange">Asosiy xizmat</span>
              <h2 className="unigo-card-title">Shahar ichida taksi</h2>
              <p className="unigo-card-caption">Tez va ishonchli xizmat. Eng yaqin haydovchini topib, safarni darhol boshlang.</p>
            </div>
            <UnigoButton onClick={() => navigate('/taxi')}>Buyurtma berish</UnigoButton>
          </div>
          <div className="unigo-hero__visual">
            <div className="unigo-vehicle-outline" />
          </div>
        </div>
      </UnigoCard>

      <UnigoSection title="Xizmatlar">
        <div className="unigo-grid-2">
          {SERVICE_ITEMS.map((item) => (
            <UnigoServiceTile
              key={item.title}
              title={item.title}
              subtitle={item.subtitle}
              icon={item.icon}
              blue={item.blue}
              onClick={() => navigate(item.to)}
            />
          ))}
        </div>
      </UnigoSection>

      <UnigoSection title="Avto savdo" actionLabel="Ko‘rish" onAction={() => navigate('/auto-market')}>
        <UnigoCard soft="soft-blue">
          <div className="unigo-card__row">
            <div className="unigo-card__stack">
              <h3 className="unigo-card-title" style={{ fontSize: 18 }}>Yangi e’lonlar</h3>
              <p className="unigo-card-caption">Mashina, barter, vikup va zapchast bo‘limlari bitta joyda.</p>
              <div>
                <UnigoStatusPill variant="info">Bugun yangilandi</UnigoStatusPill>
              </div>
            </div>
            <div className="unigo-service-tile__icon unigo-service-tile__icon--blue">
              <span className="material-symbols-outlined" data-no-auto-translate="true">directions_car</span>
            </div>
          </div>
        </UnigoCard>
      </UnigoSection>

      <UnigoSection title="Tezkor holat">
        <UnigoKpiGrid items={[
          { label: 'Faol haydovchilar', value: '128' },
          { label: 'So‘nggi buyurtmalar', value: '42' },
        ]} />
      </UnigoSection>

      <UnigoBottomNav items={navItems} />
    </UnigoScreen>
  );
}

export default memo(ClientHome);
