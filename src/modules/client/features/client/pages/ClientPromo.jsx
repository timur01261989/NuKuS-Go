import React, { memo, useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UnigoBottomNav, UnigoButton, UnigoCard, UnigoEmptyState, UnigoHeader, UnigoInput, UnigoKpiGrid, UnigoListRow, UnigoMapPanel, UnigoScreen, UnigoSection, UnigoSelect, UnigoServiceTile, UnigoStatusPill, UnigoToggle } from '@/modules/shared/ui/UnigoMobileUI.jsx';

function ClientPromo() {
  const [promo, setPromo] = useState('');
  return (
    <UnigoScreen>
      <UnigoHeader back="/profile" title="Promo kodlar" subtitle="Chegirma va aksiyalarni faollashtirish" />
      <UnigoCard>
        <div className="unigo-card__stack">
          <UnigoInput label="Promo kod" value={promo} onChange={setPromo} placeholder="Masalan: UNIGO2026" />
          <UnigoButton disabled={!promo.trim()}>Tekshirish</UnigoButton>
        </div>
      </UnigoCard>
      <UnigoSection>
        <UnigoEmptyState title="Faol promo topilmadi" description="Promo kodni kiriting. Kod to‘g‘ri bo‘lsa chegirma avtomatik qo‘llanadi." />
      </UnigoSection>
    </UnigoScreen>
  );
}

export default memo(ClientPromo);
