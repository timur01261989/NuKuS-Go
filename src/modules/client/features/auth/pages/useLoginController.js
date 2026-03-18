/**
 * useLoginController.js — Login sahifasi controller hooki
 * Auth.jsx dagi barcha biznes logikani ajratadi.
 * Auth.jsx endi faqat presentatsion qatlam bo'ladi.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { supabase } from '@/services/supabase/supabaseClient';
import { useLanguage } from '@/modules/shared/i18n/useLanguage.js';
import { getLocalizedLanguages } from '@/modules/shared/i18n/languages.js';
import { useAppMode } from '@/app/providers/AppModeProvider';
import { normalizePhoneInput, formatUzPhone } from './auth.helpers.js';
import { buildPostLoginProfileUpdate, restorePreferredPhone, validateLoginInput } from './auth.logic.js';
import { clientLogger } from '@/modules/shared/utils/clientLogger.js';
import { getErrorMessage } from '@/modules/shared/utils/errorAdapter.js';
import { buildProfileTrustState } from '../profileVerificationGuidance.js';
import { useAuthStateMachine } from './useAuthStateMachine.js';

export function useLoginController() {
  const navigate = useNavigate();
  const location = useLocation();
  const { langKey, setLanguage, t } = useLanguage();
  const { appMode } = useAppMode();
  const sm = useAuthStateMachine();

  const [phone, setPhone]               = useState('');
  const [password, setPassword]         = useState('');
  const [remember, setRemember]         = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const localizedLanguages = useMemo(() => getLocalizedLanguages(langKey), [langKey]);

  const authTrustState = useMemo(
    () => buildProfileTrustState({ hasSelfie: true, hasDocument: true, profileScore: password ? 75 : 45 }),
    [password],
  );

  // Aktiv sessiya → redirect
  useEffect(() => {
    if (!supabase?.auth) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session) navigate('/', { replace: true });
    });
  }, [navigate]);

  // Oldingi telefon raqamni tiklash
  useEffect(() => {
    const restored = restorePreferredPhone({ location, currentPhone: phone, normalizePhoneInput });
    if (restored) setPhone(restored);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const handlePhoneChange = useCallback((value) => setPhone(normalizePhoneInput(value)), []);
  const handlePasswordChange = useCallback((value) => setPassword(value), []);
  const handleTogglePassword = useCallback(() => setShowPassword((p) => !p), []);
  const handleRememberChange = useCallback((checked) => setRemember(checked), []);

  const handleSubmit = useCallback(async (event) => {
    event?.preventDefault?.();
    if (sm.isLoading) return;

    const validation = validateLoginInput({ phone, password, t });
    if (!validation.ok) { message.error(validation.message); return; }
    const digits = validation.digits;

    sm.submit(phone);
    try {
      const fullPhone = formatUzPhone(digits);
      const { error } = await supabase.auth.signInWithPassword({ phone: fullPhone, password });
      if (error) throw error;

      sm.authSuccess();

      // Profile sync — best-effort
      try {
        const { data: userPayload } = await supabase.auth.getUser();
        const user = userPayload?.user;
        if (user?.id) {
          const nowIso = new Date().toISOString();
          await supabase.from('profiles').upsert([
            buildPostLoginProfileUpdate({ user, fullPhone, nowIso }),
          ]);
        }
      } catch (profileErr) {
        clientLogger.warn('login.profile_sync_failed', { message: profileErr?.message });
      }

      message.success(t?.welcome || 'Xush kelibsiz!');
      try {
        if (remember) localStorage.setItem('last_phone', digits);
        else          localStorage.removeItem('last_phone');
      } catch { /* ignore */ }

      sm.complete();
      navigate('/', { replace: true, state: { appMode } });
    } catch (err) {
      sm.fail(getErrorMessage(err, t?.invalidLogin || 'Login xato'));
      message.error(getErrorMessage(err, t?.invalidLogin || 'Telefon yoki parol noto\'g\'ri'));
    }
  }, [sm, phone, password, t, remember, appMode, navigate]);

  const handleLanguageChange = useCallback((nextLang) => {
    setLanguage(nextLang);
    setTimeout(() => message.success(
      getLocalizedLanguages(nextLang).find((l) => l.key === nextLang)?.label || t?.languageChanged || 'Til o\'zgartirildi'
    ), 0);
  }, [setLanguage, t]);

  return {
    // state
    phone, password, remember, showPassword,
    loading: sm.isLoading,
    langKey,
    localizedLanguages,
    authTrustState,
    // handlers
    handlePhoneChange,
    handlePasswordChange,
    handleTogglePassword,
    handleRememberChange,
    handleSubmit,
    handleLanguageChange,
    navigate,
  };
}
