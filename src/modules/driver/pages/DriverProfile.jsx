import React, { memo, useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UnigoBottomNav, UnigoButton, UnigoCard, UnigoEmptyState, UnigoHeader, UnigoInput, UnigoKpiGrid, UnigoListRow, UnigoMapPanel, UnigoScreen, UnigoSection, UnigoSelect, UnigoServiceTile, UnigoStatusPill, UnigoToggle } from '@/modules/shared/ui/UnigoMobileUI.jsx';

function DriverProfilePage() {
  const navigate = useNavigate();
  return (
    <UnigoScreen dark>
      <UnigoHeader dark back="/driver" title="Haydovchi profili" subtitle="Asosiy ma’lumotlar va reyting" />
      <UnigoCard dark>
        <div className="unigo-card__row">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="unigo-avatar unigo-avatar--dark">AK</div>
            <div className="unigo-card__stack" style={{ gap: 4 }}>
              <h2 className="unigo-card-title" style={{ color: 'white', fontSize: 22 }}>Anvar Karimov</h2>
              <p className="unigo-card-caption unigo-card-caption--dark">Faol haydovchi • Reyting 4.9</p>
            </div>
          </div>
          <UnigoStatusPill variant="success">Tasdiqlangan</UnigoStatusPill>
        </div>
      </UnigoCard>
      <UnigoSection title="Profil bo‘limlari">
        <div className="unigo-list">
          <UnigoListRow dark icon="directions_car" title="Mashinalar" description="Aktiv mashina va tasdiqlash holati" onClick={() => navigate('/driver/vehicles')} />
          <UnigoListRow dark icon="wallet" title="Hamyon" description="Daromad va tranzaksiyalar" onClick={() => navigate('/driver/wallet')} />
          <UnigoListRow dark icon="query_stats" title="Analitika" description="Kunlik missiyalar va issiq nuqtalar" onClick={() => navigate('/driver/insights')} />
          <UnigoListRow dark icon="group_add" title="Referral" description="Taklif mukofotlari" onClick={() => navigate('/driver/referral')} />
        </div>
      </UnigoSection>
    </UnigoScreen>
  );
}

export default memo(DriverProfilePage);
