import React, { memo, useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UnigoBottomNav, UnigoButton, UnigoCard, UnigoEmptyState, UnigoHeader, UnigoInput, UnigoKpiGrid, UnigoListRow, UnigoMapPanel, UnigoScreen, UnigoSection, UnigoSelect, UnigoServiceTile, UnigoStatusPill, UnigoToggle } from '@/modules/shared/ui/UnigoMobileUI.jsx';

function ClientReferral() {
  const navigate = useNavigate();
  return (
    <UnigoScreen>
      <UnigoHeader back="/profile" title="Do‘stlarni taklif qilish" subtitle="Taklif kodi va bonuslar" />
      <UnigoCard soft="soft-orange">
        <div className="unigo-card__stack">
          <span className="unigo-pill unigo-pill--orange">Taklif kodi</span>
          <h2 className="unigo-card-title" style={{ fontSize: 32 }}>UNIGO10</h2>
          <p className="unigo-card-caption">Do‘stingiz ro‘yxatdan o‘tsa va faol bo‘lsa, bonus hisoblanadi.</p>
        </div>
      </UnigoCard>
      <div className="unigo-buttons" style={{ marginTop: 20 }}>
        <UnigoButton icon="share">Do‘stlarni taklif qilish</UnigoButton>
        <UnigoButton variant="secondary" icon="content_copy">Taklif havolasini nusxalash</UnigoButton>
      </div>
      <UnigoSection title="Statistika">
        <UnigoKpiGrid items={[
          { label: 'Taklif qilinganlar', value: '18' },
          { label: 'Faol bo‘lganlar', value: '9' },
          { label: 'Bonus olinganlar', value: '6' },
          { label: 'Mukofot summasi', value: '145 000' },
        ]} />
      </UnigoSection>
      <UnigoSection title="Bonuslar ro‘yxati">
        <div className="unigo-list">
          <UnigoListRow icon="redeem" title="Yangi foydalanuvchi bonuslari" description="6 ta foydalanuvchi faollashdi" value="+90 000" />
          <UnigoListRow icon="emoji_events" title="Haydovchi taklif mukofoti" description="3 ta haydovchi tasdiqlandi" value="+55 000" />
        </div>
      </UnigoSection>
      <UnigoButton variant="secondary" icon="sync" onClick={() => navigate('/referral')}>Yangilash</UnigoButton>
    </UnigoScreen>
  );
}

export default memo(ClientReferral);
