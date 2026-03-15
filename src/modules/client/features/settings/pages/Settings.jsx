import React, { useEffect, useMemo, useState } from 'react';
import { Card, Divider, Select, Switch, Typography, message, Segmented } from 'antd';
import { useLanguage } from '@/modules/shared/i18n/useLanguage.js';
import { getLocalizedLanguages, getLocalizedLanguageLabel } from '@/modules/shared/i18n/languages.js';
import PageBackButton from '@/modules/shared/components/PageBackButton';
import { useLocation } from 'react-router-dom';

const { Title, Text } = Typography;

function safeNightModeValue(v) {
  return v === 'on' || v === 'off' || v === 'auto' ? v : 'auto';
}

function safeBoolFromLS(v, fallback = true) {
  if (v === '1') return true;
  if (v === '0') return false;
  return fallback;
}

export default function Settings() {
  const { langKey, setLanguage, t } = useLanguage();
  const localizedLanguages = useMemo(() => getLocalizedLanguages(langKey), [langKey]);
  const location = useLocation();
  const backFallback = useMemo(() => (location.pathname.startsWith('/driver') ? '/driver/dashboard' : '/client/home'), [location.pathname]);
  const [nightMode, setNightMode] = useState('auto');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    const savedNight = safeNightModeValue(localStorage.getItem('nightMode'));
    setNightMode(savedNight);
    const savedNotif = safeBoolFromLS(localStorage.getItem('notificationsEnabled'), true);
    setNotificationsEnabled(savedNotif);
  }, []);

  const onLang = (v) => {
    setLanguage(v);
    message.success(t.languageChanged);
  };

  const onNightMode = (v) => {
    const next = safeNightModeValue(v);
    setNightMode(next);
    localStorage.setItem('nightMode', next);
    window.dispatchEvent(new Event('nightModeChanged'));
    if (next === 'auto') message.success(t.nightModeAuto);
    if (next === 'on') message.success(t.nightModeOn);
    if (next === 'off') message.success(t.nightModeOff);
  };

  const onNotifications = (checked) => {
    setNotificationsEnabled(checked);
    localStorage.setItem('notificationsEnabled', checked ? '1' : '0');
    message.success(checked ? t.notificationsOn : t.notificationsOff);
  };

  return (
    <div style={{ padding: 14, maxWidth: 680, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <PageBackButton fallback={backFallback} />
        <Title level={3} style={{ margin: 0 }}>
          {t.settingsTitle}
        </Title>
      </div>

      <Card style={{ borderRadius: 16 }}>
        <Text strong>{t.language}</Text>
        <div style={{ marginTop: 8 }}>
          <Select key={langKey} value={langKey} options={localizedLanguages.map((lang) => ({ value: lang.key, label: lang.label }))} style={{ width: '100%' }} onChange={onLang} optionLabelProp="label" popupMatchSelectWidth={false} labelRender={({ value }) => getLocalizedLanguageLabel(value, langKey)} />
        </div>

        <Divider />

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ minWidth: 220 }}>
            <Text strong>{t.nightMode}</Text>
            <br />
            <Text type="secondary">
              {t.nightModeHint}
              <br />
              <span style={{ opacity: 0.85 }}>
                {t.current}: <b>{nightMode}</b>
              </span>
            </Text>
          </div>

          <Segmented
            value={nightMode}
            onChange={onNightMode}
            options={[
              { label: t.auto, value: 'auto' },
              { label: t.on, value: 'on' },
              { label: t.off, value: 'off' },
            ]}
          />
        </div>

        <Divider />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <Text strong>{t.notifications}</Text>
            <br />
            <Text type="secondary">{t.notificationsHint}</Text>
          </div>

          <Switch checked={notificationsEnabled} onChange={onNotifications} />
        </div>
      </Card>
    </div>
  );
}
