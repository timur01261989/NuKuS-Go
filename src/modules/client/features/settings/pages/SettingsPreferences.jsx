/**
 * SettingsPreferences.jsx — Til, tungi rejim, bildirishnomalar (pure UI)
 * DOCX: Settings.jsx dan ajratildi
 */
import React, { memo } from 'react';
import { Card, Divider, Segmented, Select, Switch, Typography } from 'antd';
import { getLocalizedLanguageLabel } from '@/modules/shared/i18n/languages.js';

const { Text } = Typography;

function SettingsPreferences({
  langKey, t, localizedLanguages,
  nightMode, notifEnabled,
  onLanguage, onNightMode, onNotifications,
}) {
  return (
    <Card style={{ borderRadius: 16 }}>
      {/* Til */}
      <Text strong>{t?.language || 'Til'}</Text>
      <div style={{ marginTop: 8 }}>
        <Select
          key={langKey}
          value={langKey}
          options={localizedLanguages.map((l) => ({ value: l.key, label: l.label }))}
          style={{ width: '100%' }}
          onChange={onLanguage}
          optionLabelProp="label"
          popupMatchSelectWidth={false}
          labelRender={({ value }) => getLocalizedLanguageLabel(value, langKey)}
        />
      </div>

      <Divider />

      {/* Tungi rejim */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
        <div style={{ minWidth: 220 }}>
          <Text strong>{t?.nightMode || 'Tungi rejim'}</Text>
          <br/>
          <Text type="secondary">
            {t?.nightModeHint || 'Ilovaning ko\'rinishini sozlang'}
            <br/>
            <span style={{ opacity:0.85 }}>{t?.current || 'Joriy'}: <b>{nightMode}</b></span>
          </Text>
        </div>
        <Segmented
          value={nightMode}
          onChange={onNightMode}
          options={[
            { label: t?.auto || 'Avto', value: 'auto' },
            { label: t?.on   || 'Yoq',  value: 'on'   },
            { label: t?.off  || 'O\'ch', value: 'off'  },
          ]}
        />
      </div>

      <Divider />

      {/* Bildirishnomalar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
        <div>
          <Text strong>{t?.notifications || 'Bildirishnomalar'}</Text>
          <br/>
          <Text type="secondary">{t?.notificationsHint || 'Push bildirishnomalar'}</Text>
        </div>
        <Switch checked={notifEnabled} onChange={onNotifications} />
      </div>
    </Card>
  );
}

export default memo(SettingsPreferences);
