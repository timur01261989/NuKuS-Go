import React, { memo, useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UnigoBottomNav, UnigoButton, UnigoCard, UnigoEmptyState, UnigoHeader, UnigoInput, UnigoKpiGrid, UnigoListRow, UnigoMapPanel, UnigoScreen, UnigoSection, UnigoSelect, UnigoServiceTile, UnigoStatusPill, UnigoToggle } from '@/modules/shared/ui/UnigoMobileUI.jsx';

function DriverSettingsPage() {
  const [standardMode, setStandardMode] = useState(true);
  return (
    <UnigoScreen dark>
      <UnigoHeader dark back="/driver" title="Haydovchi sozlamalari" subtitle="Xizmatlar, ish rejimi va tasdiqlash holatlari" />
      <UnigoCard dark>
        <div className="unigo-card__stack">
          <div className="unigo-card__row">
            <div>
              <h3 className="unigo-card-title" style={{ fontSize: 18, color: 'white' }}>Ish rejimi</h3>
              <p className="unigo-card-caption unigo-card-caption--dark">Standart yoki premium yo‘nalish</p>
            </div>
            <UnigoToggle checked={standardMode} onChange={setStandardMode} />
          </div>
          <div className="unigo-list">
            <UnigoListRow dark icon="badge" title="Ariza holati" description="Ko‘rib chiqildi" value="Tasdiqlangan" />
            <UnigoListRow dark icon="directions_car" title="Asosiy mashina" description="Chevrolet Cobalt • 01 A 123 BC" />
            <UnigoListRow dark icon="apps" title="Faol xizmatlar" description="Yo‘lovchi, eltish, yuk tashish" />
          </div>
        </div>
      </UnigoCard>
    </UnigoScreen>
  );
}

export default memo(DriverSettingsPage);
