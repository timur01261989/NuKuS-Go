/**
 * SettingsPage.jsx — Sozlamalar sahifasi (composition root)
 * DOCX: Settings.jsx → SettingsPage.jsx, SettingsPreferences.jsx, SettingsAccount.jsx, useSettingsController.js
 */
import React, { memo } from 'react';
import { Typography } from 'antd';
import PageBackButton from '@/modules/shared/components/PageBackButton';
import { useSettingsController } from './useSettingsController.js';
import SettingsPreferences from './SettingsPreferences.jsx';

const { Title } = Typography;

function SettingsPage() {
  const ctrl = useSettingsController();
  return (
    <div style={{ padding:14, maxWidth:680, margin:'0 auto' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
        <PageBackButton fallback={ctrl.backFallback} />
        <Title level={3} style={{ margin:0 }}>{ctrl.t?.settingsTitle || 'Sozlamalar'}</Title>
      </div>
      <SettingsPreferences
        langKey={ctrl.langKey}
        t={ctrl.t}
        localizedLanguages={ctrl.localizedLanguages}
        nightMode={ctrl.nightMode}
        notifEnabled={ctrl.notifEnabled}
        onLanguage={ctrl.handleLanguage}
        onNightMode={ctrl.handleNightMode}
        onNotifications={ctrl.handleNotifications}
      />
    </div>
  );
}

export default memo(SettingsPage);
