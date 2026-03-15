import React, { memo, useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UnigoBottomNav, UnigoButton, UnigoCard, UnigoEmptyState, UnigoHeader, UnigoInput, UnigoKpiGrid, UnigoListRow, UnigoMapPanel, UnigoScreen, UnigoSection, UnigoSelect, UnigoServiceTile, UnigoStatusPill, UnigoToggle } from '@/modules/shared/ui/UnigoMobileUI.jsx';

function DriverWalletPage() {
  return (
    <UnigoScreen dark>
      <UnigoHeader dark back="/driver" title="Haydovchi hamyoni" subtitle="Daromad, chiqarish va balans harakati" />
      <UnigoCard dark>
        <div className="unigo-card__stack">
          <span className="unigo-pill unigo-pill--orange">Mavjud balans</span>
          <h2 className="unigo-card-title" style={{ fontSize: 30, color: 'white' }}>1 420 000 so‘m</h2>
          <p className="unigo-card-caption unigo-card-caption--dark">Chiqarish va to‘ldirish amallari shu bo‘limdan boshqariladi.</p>
        </div>
      </UnigoCard>
      <div className="unigo-buttons" style={{ marginTop: 20 }}>
        <UnigoButton>To‘ldirish</UnigoButton>
        <UnigoButton variant="dark-secondary">Pul yechish</UnigoButton>
      </div>
    </UnigoScreen>
  );
}

export default memo(DriverWalletPage);
