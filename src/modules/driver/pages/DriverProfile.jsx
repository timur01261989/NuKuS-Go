import React, { memo, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/modules/shared/auth/AuthProvider.jsx';
import { useAppMode } from '@/app/providers/AppModeProvider.jsx';
import { UnigoButton, UnigoCard, UnigoHeader, UnigoListRow, UnigoScreen, UnigoSection, UnigoStatusPill } from '@/modules/shared/ui/UnigoMobileUI.jsx';

function getInitials(fullName, phone) {
  const safeName = String(fullName || '').trim();
  if (safeName) {
    const parts = safeName.split(/\s+/).filter(Boolean).slice(0, 2);
    const label = parts.map((part) => part[0] || '').join('');
    if (label) return label.toUpperCase();
  }
  return String(phone || 'D').replace(/\D/g, '').slice(-2) || 'D';
}

function DriverModeSwitchCard({ onSwitch }) {
  return (
    <UnigoCard dark>
      <div className="unigo-card__stack" style={{ gap: 14 }}>
        <div className="unigo-card__row" style={{ alignItems: 'flex-start' }}>
          <div className="unigo-card__stack" style={{ gap: 6, flex: 1 }}>
            <span className="unigo-pill unigo-pill--orange">Yo‘lovchi rejimi</span>
            <h3 className="unigo-card-title" style={{ color: 'white', fontSize: 22 }}>Yo‘lovchi tarafga o‘tish</h3>
            <p className="unigo-card-caption unigo-card-caption--dark">Asosiy xizmatlar, buyurtmalar va hamyon bo‘limiga qayting.</p>
          </div>
          <div className="unigo-list-row__icon" style={{ flexShrink: 0, background: 'rgba(244,106,10,0.16)', color: '#f46a0a' }}>
            <span className="material-symbols-outlined" data-no-auto-translate="true">switch_account</span>
          </div>
        </div>
        <UnigoButton variant="dark-secondary" icon="arrow_back" onClick={onSwitch}>Yo‘lovchi sahifasiga o‘tish</UnigoButton>
      </div>
    </UnigoCard>
  );
}

function DriverProfilePage() {
  const navigate = useNavigate();
  const { setAppMode } = useAppMode();
  const auth = useAuth();

  const fullName = String(auth?.profile?.full_name || '').trim();
  const phone = String(auth?.profile?.phone || auth?.user?.phone || '').trim();
  const avatarLabel = useMemo(() => getInitials(fullName, phone), [fullName, phone]);
  const approved = !!auth?.driverApproved;

  const handleSwitchToClient = useCallback(() => {
    setAppMode('client');
    navigate('/', { replace: true });
  }, [navigate, setAppMode]);

  return (
    <UnigoScreen dark>
      <UnigoHeader dark back="/driver" title="Haydovchi profili" subtitle="Asosiy ma’lumotlar va boshqaruv" />
      <UnigoCard dark>
        <div className="unigo-card__row">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="unigo-avatar unigo-avatar--dark">{avatarLabel}</div>
            <div className="unigo-card__stack" style={{ gap: 4 }}>
              <h2 className="unigo-card-title" style={{ color: 'white', fontSize: 22 }}>{fullName || 'Haydovchi'}</h2>
              <p className="unigo-card-caption unigo-card-caption--dark">{phone || 'Telefon raqami kiritilmagan'}</p>
            </div>
          </div>
          <UnigoStatusPill variant={approved ? 'success' : 'warning'}>{approved ? 'Tasdiqlangan' : 'Kutilmoqda'}</UnigoStatusPill>
        </div>
      </UnigoCard>

      <UnigoSection title="Rejimni almashtirish">
        <DriverModeSwitchCard onSwitch={handleSwitchToClient} />
      </UnigoSection>

      <UnigoSection title="Profil bo‘limlari">
        <div className="unigo-list">
          <UnigoListRow dark icon="directions_car" title="Mashinalar" description="Aktiv mashina va tasdiqlash holati" onClick={() => navigate('/driver/vehicles')} />
          <UnigoListRow dark icon="wallet" title="Hamyon" description="Daromad va tranzaksiyalar" onClick={() => navigate('/driver/wallet')} />
          <UnigoListRow dark icon="query_stats" title="Analitika" description="Kunlik missiyalar va issiq nuqtalar" onClick={() => navigate('/driver/insights')} />
          <UnigoListRow dark icon="group_add" title="Do‘stlarni taklif qilish" description="Taklif kodi va mukofotlar" onClick={() => navigate('/driver/referral')} />
        </div>
      </UnigoSection>
    </UnigoScreen>
  );
}

export default memo(DriverProfilePage);
