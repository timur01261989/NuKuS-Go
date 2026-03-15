import React, { memo, useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UnigoBottomNav, UnigoButton, UnigoCard, UnigoEmptyState, UnigoHeader, UnigoInput, UnigoKpiGrid, UnigoListRow, UnigoMapPanel, UnigoScreen, UnigoSection, UnigoSelect, UnigoServiceTile, UnigoStatusPill, UnigoToggle } from '@/modules/shared/ui/UnigoMobileUI.jsx';

function DriverReferralPage() {
  return (
    <UnigoScreen dark>
      <UnigoHeader dark back="/driver" title="Haydovchi referral" subtitle="Takliflar va mukofotlar" />
      <UnigoCard dark>
        <div className="unigo-card__stack">
          <span className="unigo-pill unigo-pill--orange">Taklif kodi</span>
          <h2 className="unigo-card-title" style={{ color: 'white', fontSize: 30 }}>DRIVER3000</h2>
          <p className="unigo-card-caption unigo-card-caption--dark">Har tasdiqlangan haydovchi uchun bonus yoziladi.</p>
        </div>
      </UnigoCard>
      <UnigoSection title="Natijalar">
        <UnigoKpiGrid dark items={[
          { label: 'Taklif qilingan haydovchi', value: '7' },
          { label: 'Mukofot', value: '210 000' },
        ]} />
      </UnigoSection>
    </UnigoScreen>
  );
}

export default memo(DriverReferralPage);
