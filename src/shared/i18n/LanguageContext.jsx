import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { translations } from '../../i18n/translations';
import { createTranslator } from './createTranslator';
import { AVAILABLE_LANGUAGES, DEFAULT_LANGUAGE, normalizeLanguageKey, getLanguageMeta, getLocalizedLanguages } from './languages';

const STORAGE_KEY = 'appLang';

export const LanguageContext = createContext({
  language: DEFAULT_LANGUAGE,
  langKey: DEFAULT_LANGUAGE,
  setLanguage: (_k) => {},
  setLangKey: (_k) => {},
  t: translations[DEFAULT_LANGUAGE] || {},
  tr: (key, fallback = '') => fallback || key,
  availableLanguages: AVAILABLE_LANGUAGES,
  currentLanguageMeta: getLanguageMeta(DEFAULT_LANGUAGE),
});

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      return normalizeLanguageKey(localStorage.getItem(STORAGE_KEY) || DEFAULT_LANGUAGE);
    } catch {
      return DEFAULT_LANGUAGE;
    }
  });

  const setLanguage = useCallback((key) => {
    const normalized = normalizeLanguageKey(key);
    setLanguageState(normalized);
    try {
      localStorage.setItem(STORAGE_KEY, normalized);
    } catch {}
    if (typeof document !== 'undefined') {
      document.documentElement.lang = normalized;
    }
    window.dispatchEvent(new CustomEvent('appLangChanged', { detail: { key: normalized } }));
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  useEffect(() => {
    const onExternal = (e) => {
      const next = normalizeLanguageKey(e?.detail?.key || localStorage.getItem(STORAGE_KEY) || DEFAULT_LANGUAGE);
      setLanguageState(next);
    };
    window.addEventListener('appLangChanged', onExternal);
    window.addEventListener('storage', onExternal);
    return () => {
      window.removeEventListener('appLangChanged', onExternal);
      window.removeEventListener('storage', onExternal);
    };
  }, []);

  const value = useMemo(() => {
    const { tr, proxy } = createTranslator(translations, language);
    return {
      language,
      langKey: language,
      setLanguage,
      setLangKey: setLanguage,
      t: proxy,
      tr,
      availableLanguages: getLocalizedLanguages(language),
      currentLanguageMeta: getLanguageMeta(language),
    };
  }, [language, setLanguage]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
