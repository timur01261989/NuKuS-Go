// src/features/settings/pages/Settings.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Card, Divider, Select, Switch, Typography, message, Segmented } from 'antd';
import { useLanguage } from '@shared/i18n/useLanguage'; // Eslatma: useLanguage hook faylingiz mavjudligiga ishonch hosil qiling
import { getLocalizedLanguages, getLocalizedLanguageLabel } from '@shared/i18n/languages';
import PageBackButton from '@/shared/components/PageBackButton';
import { useLocation } from 'react-router-dom';

const { Title, Text } = Typography;

/**
 * Night mode qiymatini xavfsiz holatga keltiradi
 */
function safeNightModeValue(v) {
  return v === 'on' || v === 'off' || v === 'auto' ? v : 'auto';
}

/**
 * LocalStorage dan boolean qiymatni xavfsiz o'qiydi
 */
function safeBoolFromLS(v, fallback = true) {
  if (v === '1') return true;
  if (v === '0') return false;
  return fallback;
}

export default function Settings() {
  const { langKey, setLanguage, t } = useLanguage();
  
  // Tillarni joriy tilga moslab olish (memoized)
  const localizedLanguages = useMemo(() => getLocalizedLanguages(langKey), [langKey]);
  
  const location = useLocation();
  
  // Orqaga qaytish manzili (Haydovchi yoki Mijoz ekanligiga qarab)
  const backFallback = useMemo(() => 
    (location.pathname.startsWith('/driver') ? '/driver/dashboard' : '/client/home'), 
    [location.pathname]
  );

  const [nightMode, setNightMode] = useState('auto');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Sozlamalarni LocalStorage dan yuklash
  useEffect(() => {
    const savedNight = safeNightModeValue(localStorage.getItem('nightMode'));
    setNightMode(savedNight);
    
    const savedNotif = safeBoolFromLS(localStorage.getItem('notificationsEnabled'), true);
    setNotificationsEnabled(savedNotif);
  }, []);

  /**
   * Tilni o'zgartirish handler-i
   */
  const onLang = (v) => {
    setLanguage(v);
    // Agar t.languageChanged mavjud bo'lmasa, default xabar
    message.success(t.languageChanged || "Til muvaffaqiyatli o'zgartirildi");
  };

  /**
   * Tungi rejimni o'zgartirish
   */
  const onNightMode = (v) => {
    const next = safeNightModeValue(v);
    setNightMode(next);
    localStorage.setItem('nightMode', next);
    
    // Tizimga rejim o'zgarganini xabar berish (Global event)
    window.dispatchEvent(new Event('nightModeChanged'));
    
    // Xabarnomalar
    if (next === 'auto') message.success(t.nightModeAuto || "Tungi rejim: Avtomatik");
    if (next === 'on') message.success(t.nightModeOn || "Tungi rejim: Yoqildi");
    if (next === 'off') message.success(t.nightModeOff || "Tungi rejim: O'chirildi");
  };

  /**
   * Bildirishnomalarni yoqish/o'chirish
   */
  const onNotifications = (checked) => {
    setNotificationsEnabled(checked);
    localStorage.setItem('notificationsEnabled', checked ? '1' : '0');
    message.success(checked 
      ? (t.notificationsOn || "Bildirishnomalar yoqildi") 
      : (t.notificationsOff || "Bildirishnomalar o'chirildi")
    );
  };

  return (
    <div style={{ padding: 14, maxWidth: 680, margin: '0 auto' }}>
      {/* Sarlavha va Orqaga tugmasi */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <PageBackButton fallback={backFallback} />
        <Title level={3} style={{ margin: 0 }}>
          {t.settingsTitle || 'Sozlamalar'}
        </Title>
      </div>

      <Card style={{ borderRadius: 16 }}>
        {/* Tilni tanlash bo'limi */}
        <Text strong>{t.language || 'Til'}</Text>
        <div style={{ marginTop: 8 }}>
          <Select 
            key={langKey} 
            value={langKey} 
            options={localizedLanguages.map((lang) => ({ value: lang.key, label: lang.label }))} 
            style={{ width: '100%' }} 
            onChange={onLang} 
            optionLabelProp="label" 
            popupMatchSelectWidth={false} 
            labelRender={({ value }) => getLocalizedLanguageLabel(value, langKey)} 
          />
        </div>

        <Divider />

        {/* Tungi rejim bo'limi */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ minWidth: 220 }}>
            <Text strong>{t.nightMode || 'Tungi rejim'}</Text>
            <br />
            <Text type="secondary">
              {t.nightModeHint || 'Ekran ranglarini tungi vaqtga moslash'}
              <br />
              <span style={{ opacity: 0.85 }}>
                {t.current || 'Hozirgi'}: <b>{nightMode}</b>
              </span>
            </Text>
          </div>

          <Segmented
            value={nightMode}
            onChange={onNightMode}
            options={[
              { label: t.auto || 'Avto', value: 'auto' },
              { label: t.on || 'On', value: 'on' },
              { label: t.off || 'Off', value: 'off' },
            ]}
          />
        </div>

        <Divider />

        {/* Bildirishnomalar bo'limi */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <Text strong>{t.notifications || 'Bildirishnomalar'}</Text>
            <br />
            <Text type="secondary">{t.notificationsHint || 'Ilova ichidagi xabarlar haqida bildirish'}</Text>
          </div>

          <Switch checked={notificationsEnabled} onChange={onNotifications} />
        </div>
      </Card>
    </div>
  );
}