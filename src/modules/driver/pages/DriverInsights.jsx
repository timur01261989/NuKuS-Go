import React, { memo, useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UnigoBottomNav, UnigoButton, UnigoCard, UnigoEmptyState, UnigoHeader, UnigoInput, UnigoKpiGrid, UnigoListRow, UnigoMapPanel, UnigoScreen, UnigoSection, UnigoSelect, UnigoServiceTile, UnigoStatusPill, UnigoToggle } from '@/modules/shared/ui/UnigoMobileUI.jsx';

function DriverInsightsPage() {
  return (
    <UnigoScreen dark>
      <UnigoHeader dark back="/driver" title="Analitika" subtitle="Kunlik missiyalar, qizg‘in nuqtalar va talab" />
      <UnigoSection title="Kunlik missiyalar">
        <UnigoKpiGrid dark items={[
          { label: 'Bajarildi', value: '3/5' },
          { label: 'Bonus', value: '35 000' },
        ]} />
      </UnigoSection>
      <UnigoSection title="Qizg‘in nuqtalar">
        <UnigoMapPanel dark>
          <div style={{ position: 'absolute', left: 20, bottom: 20, color: 'white', zIndex: 2 }}>
            Nukus markazi • Aeroport • Bozor
          </div>
        </UnigoMapPanel>
      </UnigoSection>
      <UnigoSection>
        <UnigoEmptyState dark title="Hozircha faol missiya yo‘q" description="Talab yuqori bo‘ladigan hududlar shu ekran orqali ko‘rsatiladi." />
      </UnigoSection>
    </UnigoScreen>
  );
}

export default memo(DriverInsightsPage);
