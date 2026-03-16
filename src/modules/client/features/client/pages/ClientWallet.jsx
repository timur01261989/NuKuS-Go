import React, { memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/modules/shared/auth/AuthProvider.jsx';
import { getOwnReferralSnapshot } from '@/services/referralLinkService.js';
import { UnigoBottomNav, UnigoButton, UnigoCard, UnigoEmptyState, UnigoHeader, UnigoListRow, UnigoScreen, UnigoSection } from '@/modules/shared/ui/UnigoMobileUI.jsx';

function formatMoney(value) {
  const amount = Number(value || 0);
  return `${amount.toLocaleString('uz-UZ')} so‘m`;
}

function ClientWallet() {
  const navigate = useNavigate();
  const auth = useAuth();
  const snapshot = auth?.referralSnapshot || getOwnReferralSnapshot() || null;
  const wallet = snapshot?.wallet || null;
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
          <h2 className="unigo-card-title" style={{ fontSize: 30 }}>{formatMoney(wallet?.balance_uzs || 0)}</h2>
          <p className="unigo-card-caption">To‘lovlar va bonuslar shu hisobda jamlanadi.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <span className="unigo-pill unigo-pill--info">Bonus: {formatMoney(wallet?.bonus_balance_uzs || 0)}</span>
            <span className="unigo-pill unigo-pill--warning">Band summa: {formatMoney(wallet?.reserved_uzs || 0)}</span>
          </div>
        </div>
      </UnigoCard>
      <div className="unigo-buttons" style={{ marginTop: 20 }}>
        <UnigoButton icon="add_card">Pul qo‘shish</UnigoButton>
        <UnigoButton variant="secondary" icon="sync">Balansni yangilash</UnigoButton>
      </div>
      <UnigoSection title="Hamyon holati">
        {wallet ? (
          <div className="unigo-list">
            <UnigoListRow icon="south_west" title="Kiritilgan mablag‘" description="Jami tushum" value={formatMoney(wallet?.total_topup_uzs || 0)} />
            <UnigoListRow icon="north_east" title="Sarflangan mablag‘" description="Jami to‘lovlar" value={formatMoney(wallet?.total_spent_uzs || 0)} />
            <UnigoListRow icon="savings" title="Jami bonus va daromad" description="Mukofot va bonuslar" value={formatMoney(wallet?.total_earned_uzs || 0)} />
          </div>
        ) : (
          <UnigoEmptyState title="Hamyon ma’lumoti hali tayyor emas" description="Balans ma’lumotlari yuklangach bu yerda ko‘rinadi." />
        )}
      </UnigoSection>
      <UnigoSection>
        <UnigoEmptyState title="Hozircha tranzaksiya yo‘q" description="Pul qo‘shish yoki to‘lov qilganingizdan keyin tarix shu yerda chiqadi." />
      </UnigoSection>
      <UnigoBottomNav items={navItems} />
    </UnigoScreen>
  );
}

export default memo(ClientWallet);
