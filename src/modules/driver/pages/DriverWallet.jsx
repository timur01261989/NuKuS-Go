import React, { memo } from 'react';
import { useAuth } from '@/modules/shared/auth/AuthProvider.jsx';
import { getOwnReferralSnapshot } from '@/services/referralLinkService.js';
import { UnigoButton, UnigoCard, UnigoEmptyState, UnigoHeader, UnigoListRow, UnigoScreen, UnigoSection } from '@/modules/shared/ui/UnigoMobileUI.jsx';

function formatMoney(value) {
  const amount = Number(value || 0);
  return `${amount.toLocaleString('uz-UZ')} so‘m`;
}

function DriverWalletPage() {
  const auth = useAuth();
  const snapshot = auth?.referralSnapshot || getOwnReferralSnapshot() || null;
  const wallet = snapshot?.wallet || null;

  return (
    <UnigoScreen dark>
      <UnigoHeader dark back="/driver" title="Haydovchi hamyoni" subtitle="Daromad, chiqarish va balans harakati" />
      <UnigoCard dark>
        <div className="unigo-card__stack">
          <span className="unigo-pill unigo-pill--orange">Mavjud balans</span>
          <h2 className="unigo-card-title" style={{ fontSize: 30, color: 'white' }}>{formatMoney(wallet?.balance_uzs || 0)}</h2>
          <p className="unigo-card-caption unigo-card-caption--dark">Chiqarish va to‘ldirish amallari shu bo‘limdan boshqariladi.</p>
        </div>
      </UnigoCard>
      <div className="unigo-buttons" style={{ marginTop: 20 }}>
        <UnigoButton>To‘ldirish</UnigoButton>
        <UnigoButton variant="dark-secondary">Pul yechish</UnigoButton>
      </div>
      <UnigoSection title="Hamyon holati">
        {wallet ? (
          <div className="unigo-list">
            <UnigoListRow dark icon="account_balance_wallet" title="Bonus balansi" description="Mukofot va bonuslar" value={formatMoney(wallet?.bonus_balance_uzs || 0)} />
            <UnigoListRow dark icon="payments" title="Jami tushum" description="Kiritilgan mablag‘" value={formatMoney(wallet?.total_topup_uzs || 0)} />
            <UnigoListRow dark icon="shopping_cart_checkout" title="Jami sarf" description="Yechilgan va ishlatilgan mablag‘" value={formatMoney(wallet?.total_spent_uzs || 0)} />
          </div>
        ) : (
          <UnigoEmptyState dark title="Hamyon ma’lumoti tayyor emas" description="Balans ma’lumotlari yuklangach shu yerda chiqadi." />
        )}
      </UnigoSection>
    </UnigoScreen>
  );
}

export default memo(DriverWalletPage);
