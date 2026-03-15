import React, { memo, useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UnigoBottomNav, UnigoButton, UnigoCard, UnigoEmptyState, UnigoHeader, UnigoInput, UnigoKpiGrid, UnigoListRow, UnigoMapPanel, UnigoScreen, UnigoSection, UnigoSelect, UnigoServiceTile, UnigoStatusPill, UnigoToggle } from '@/modules/shared/ui/UnigoMobileUI.jsx';

function DriverVehiclesPage() {
  return (
    <UnigoScreen dark>
      <UnigoHeader dark back="/driver" title="Mashinalar" subtitle="Aktiv mashina va so‘rovlar tarixi" rightActions={[{ icon: 'add', label: 'Yangi mashina', onClick: () => {} }]} />
      <UnigoCard dark>
        <div className="unigo-card__stack">
          <span className="unigo-pill unigo-pill--info">Aktiv mashina</span>
          <h2 className="unigo-card-title" style={{ color: 'white' }}>Chevrolet Cobalt</h2>
          <p className="unigo-card-caption unigo-card-caption--dark">Davlat raqami: 01 A 123 BC • O‘rindiq: 4 • Holat: Tasdiqlangan</p>
        </div>
      </UnigoCard>
      <UnigoSection title="So‘rovlar tarixi">
        <div className="unigo-list">
          <UnigoListRow dark icon="pending_actions" title="Hyundai Porter" description="Kutilmoqda" />
          <UnigoListRow dark icon="cancel" title="Daewoo Damas" description="Rad etilgan" />
        </div>
      </UnigoSection>
    </UnigoScreen>
  );
}

export default memo(DriverVehiclesPage);
