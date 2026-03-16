import React, { memo, useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UnigoBottomNav, UnigoButton, UnigoCard, UnigoEmptyState, UnigoHeader, UnigoInput, UnigoKpiGrid, UnigoListRow, UnigoMapPanel, UnigoScreen, UnigoSection, UnigoSelect, UnigoServiceTile, UnigoStatusPill, UnigoToggle } from '@/modules/shared/ui/UnigoMobileUI.jsx';

function SettingsPage() {
  const [nightMode, setNightMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState('uz_latn');
  return (
    <UnigoScreen>
      <UnigoHeader back="/profile" title="Sozlamalar" subtitle="Ilova ko‘rinishi va umumiy boshqaruv" />
      <UnigoSection title="Asosiy sozlamalar">
        <UnigoCard>
          <div className="unigo-list" style={{ gap: 18 }}>
            <div className="unigo-card__row">
              <div className="unigo-card__stack" style={{ gap: 4 }}>
                <div className="unigo-list-row__title">Til</div>
                <div className="unigo-list-row__desc">Standart interfeys tili</div>
              </div>
              <select className="unigo-select" value={language} onChange={(e) => setLanguage(e.target.value)} style={{ width: 170 }}>
                <option value="uz_latn">O‘zbekcha (Lotin)</option>
                <option value="uz_kir">Ўзбекча (Кирилл)</option>
                <option value="qq_latn">Qaraqalpaqsha (Latin)</option>
                <option value="qq_kir">Қарақалпақша (Кирилл)</option>
                <option value="ru">Русский</option>
                <option value="en">English</option>
              </select>
            </div>
            <div className="unigo-card__row">
              <div className="unigo-card__stack" style={{ gap: 4 }}>
                <div className="unigo-list-row__title">Tungi rejim</div>
                <div className="unigo-list-row__desc">Auto, yoqilgan yoki o‘chirilgan</div>
              </div>
              <UnigoToggle checked={nightMode} onChange={setNightMode} />
            </div>
            <div className="unigo-card__row">
              <div className="unigo-card__stack" style={{ gap: 4 }}>
                <div className="unigo-list-row__title">Bildirishnomalar</div>
                <div className="unigo-list-row__desc">Muhim hodisalar haqida xabar olish</div>
              </div>
              <UnigoToggle checked={notifications} onChange={setNotifications} />
            </div>
          </div>
        </UnigoCard>
      </UnigoSection>
      <UnigoSection>
        <UnigoEmptyState title="Sozlamalar saqlanadi" description="Til va ko‘rinish o‘zgarganda ilova keyingi kirishda shu holatda ochiladi." />
      </UnigoSection>
    </UnigoScreen>
  );
}

export default memo(SettingsPage);
