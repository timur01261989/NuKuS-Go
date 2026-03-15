import React, { memo, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/modules/shared/auth/AuthProvider.jsx';
import { useAppMode } from '@/app/providers/AppModeProvider.jsx';
import { UnigoBottomNav, UnigoButton, UnigoCard, UnigoEmptyState, UnigoHeader, UnigoListRow, UnigoScreen, UnigoSection, UnigoStatusPill } from '@/modules/shared/ui/UnigoMobileUI.jsx';

function getInitials(fullName, phone) {
  const safeName = String(fullName || '').trim();
  if (safeName) {
    const parts = safeName.split(/\s+/).filter(Boolean).slice(0, 2);
    const label = parts.map((part) => part[0] || '').join('');
    if (label) return label.toUpperCase();
  }
  return String(phone || 'U').replace(/\D/g, '').slice(-2) || 'U';
}

function formatMoney(value) {
  const amount = Number(value || 0);
  return `${amount.toLocaleString('uz-UZ')} so‘m`;
}

function ClientModeSwitchCard({ onSwitch }) {
  return (
    <UnigoCard soft="soft-blue">
      <div className="unigo-card__stack" style={{ gap: 14 }}>
        <div className="unigo-card__row" style={{ alignItems: 'flex-start' }}>
          <div className="unigo-card__stack" style={{ gap: 6, flex: 1 }}>
            <span className="unigo-pill unigo-pill--info">Haydovchi rejimi</span>
            <h3 className="unigo-card-title" style={{ fontSize: 22 }}>Haydovchi tarafga o‘tish</h3>
            <p className="unigo-card-caption">Buyurtmalar, xizmatlar va daromad boshqaruvi uchun haydovchi paneliga o‘ting.</p>
          </div>
          <div className="unigo-list-row__icon" style={{ flexShrink: 0 }}>
            <span className="material-symbols-outlined" data-no-auto-translate="true">local_taxi</span>
          </div>
        </div>
        <UnigoButton icon="arrow_forward" onClick={onSwitch}>Haydovchi paneliga o‘tish</UnigoButton>
      </div>
    </UnigoCard>
  );
}

function ClientProfile() {
  const navigate = useNavigate();
  const { setAppMode } = useAppMode();
  const auth = useAuth();

  const fullName = String(auth?.profile?.full_name || '').trim();
  const phone = String(auth?.profile?.phone || auth?.user?.phone || '').trim();
  const avatarLabel = useMemo(() => getInitials(fullName, phone), [fullName, phone]);
  const balanceUzs = Number(auth?.referralSnapshot?.wallet?.bonus_balance_uzs || auth?.referralSnapshot?.wallet?.balance_uzs || 0);

  const navItems = useMemo(() => ([
    { to: '/', icon: 'home', label: 'Asosiy' },
    { to: '/orders', icon: 'receipt_long', label: 'Buyurtmalar' },
    { to: '/wallet', icon: 'account_balance_wallet', label: 'Hamyon' },
    { to: '/profile', icon: 'person', label: 'Profil', active: true },
  ]), []);

  const handleSwitchToDriver = useCallback(() => {
    setAppMode('driver');
    navigate('/driver-mode');
  }, [navigate, setAppMode]);

  return (
    <UnigoScreen>
      <UnigoHeader back="/" title="Profil" subtitle="Hisob va shaxsiy ma’lumotlar" />
      <UnigoCard>
        <div className="unigo-card__row">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="unigo-avatar">{avatarLabel}</div>
            <div className="unigo-card__stack" style={{ gap: 4 }}>
              <h2 className="unigo-card-title" style={{ fontSize: 22 }}>{fullName || 'Foydalanuvchi'}</h2>
              <p className="unigo-card-caption">{phone || 'Telefon raqami kiritilmagan'}</p>
            </div>
          </div>
          <UnigoStatusPill variant="success">Faol</UnigoStatusPill>
        </div>
        <div style={{ marginTop: 14 }}>
          <UnigoStatusPill variant="info">Balans: {formatMoney(balanceUzs)}</UnigoStatusPill>
        </div>
      </UnigoCard>

      <UnigoSection title="Rejimni almashtirish">
        <ClientModeSwitchCard onSwitch={handleSwitchToDriver} />
      </UnigoSection>

      <UnigoSection title="Hisob bo‘limlari">
        <div className="unigo-list">
          <UnigoListRow icon="person_edit" title="Profil ma’lumotlari" description="Ism, telefon, rasm" onClick={() => navigate('/profile/details')} />
          <UnigoListRow icon="group_add" title="Do‘stlarni taklif qilish" description="Kod va havola orqali bonus oling" onClick={() => navigate('/referral')} />
          <UnigoListRow icon="confirmation_number" title="Promo kodlar" description="Chegirma va aksiyalar" onClick={() => navigate('/promo')} />
          <UnigoListRow icon="settings" title="Sozlamalar" description="Til, tungi rejim va bildirishnomalar" onClick={() => navigate('/settings')} />
          <UnigoListRow icon="logout" title="Chiqish" description="Hisobdan xavfsiz chiqish" danger onClick={() => navigate('/login')} />
        </div>
      </UnigoSection>

      {!fullName && !phone ? (
        <UnigoSection>
          <UnigoEmptyState title="Profil hali to‘ldirilmagan" description="Profil ma’lumotlarini kiritsangiz hisobingiz yanada to‘liq ko‘rinadi." actionLabel="Profilni to‘ldirish" onAction={() => navigate('/profile/details')} />
        </UnigoSection>
      ) : null}
      <UnigoBottomNav items={navItems} />
    </UnigoScreen>
  );
}

export default memo(ClientProfile);
