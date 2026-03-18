/**
 * useSettingsController.js — Settings sahifasi controller
 * DOCX: Settings.jsx → SettingsPage.jsx, SettingsPreferences.jsx,
 *       SettingsAccount.jsx, useSettingsController.js
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { message } from 'antd';
import { useLanguage } from '@/modules/shared/i18n/useLanguage.js';
import { getLocalizedLanguages } from '@/modules/shared/i18n/languages.js';
import { settingsService } from '@/modules/shared/utils/settingsService.js';

export function useSettingsController() {
  const { langKey, setLanguage, t } = useLanguage();
  const location = useLocation();

  const backFallback = useMemo(
    () => (location.pathname.startsWith('/driver') ? '/driver' : '/'),
    [location.pathname],
  );

  const localizedLanguages = useMemo(() => getLocalizedLanguages(langKey), [langKey]);

  const [nightMode,    setNightModeState]    = useState(() => settingsService.getNightMode());
  const [notifEnabled, setNotifEnabledState] = useState(() => settingsService.getNotifications());

  // Boshqa tab/window sinxronizatsiya
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === settingsService.KEYS.NIGHT_MODE)    setNightModeState(settingsService.getNightMode());
      if (e.key === settingsService.KEYS.NOTIFICATIONS) setNotifEnabledState(settingsService.getNotifications());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const handleLanguage = useCallback((v) => {
    setLanguage(v);
    message.success(t?.languageChanged || 'Til o\'zgartirildi');
  }, [setLanguage, t]);

  const handleNightMode = useCallback((v) => {
    const next = ['on','off','auto'].includes(v) ? v : 'auto';
    setNightModeState(next);
    settingsService.setNightMode(next);
    const msg = next === 'auto' ? (t?.nightModeAuto || 'Avto')
              : next === 'on'   ? (t?.nightModeOn   || 'Tungi rejim yoqildi')
              :                   (t?.nightModeOff  || 'Tungi rejim o\'chirildi');
    message.success(msg);
  }, [t]);

  const handleNotifications = useCallback((checked) => {
    setNotifEnabledState(checked);
    settingsService.setNotifications(checked);
    message.success(checked
      ? (t?.notificationsOn  || 'Bildirishnomalar yoqildi')
      : (t?.notificationsOff || 'Bildirishnomalar o\'chirildi'));
  }, [t]);

  return {
    langKey, t,
    localizedLanguages,
    nightMode, notifEnabled,
    backFallback,
    handleLanguage, handleNightMode, handleNotifications,
  };
}
