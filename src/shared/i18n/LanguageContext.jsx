// src/shared/i18n/LanguageContext.jsx
import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
// Eslatma: translations fayli manzili loyihangizga mos ekanligiga ishonch hosil qiling
import { translations } from '../../i18n/translations'; 
import { createTranslator } from './createTranslator';
import { 
  AVAILABLE_LANGUAGES, 
  DEFAULT_LANGUAGE, 
  normalizeLanguageKey, 
  getLanguageMeta, 
  getLocalizedLanguages 
} from './languages';

const STORAGE_KEY = 'appLang';

// Context yaratish va default qiymatlarni belgilash
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

/**
 * LanguageProvider komponenti
 */
export function LanguageProvider({ children }) {
  // Boshlang'ich holatni LocalStorage dan yoki default tildan olish
  const [language, setLanguageState] = useState(() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      return normalizeLanguageKey(stored || DEFAULT_LANGUAGE);
    } catch {
      return DEFAULT_LANGUAGE;
    }
  });

  /**
   * Tilni o'zgartirish funksiyasi
   */
  const setLanguage = useCallback((key) => {
    const normalized = normalizeLanguageKey(key);
    setLanguageState(normalized);
    
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, normalized);
      }
    } catch (e) {
      console.error("LocalStorage error:", e);
    }

    if (typeof document !== 'undefined') {
      document.documentElement.lang = normalized;
    }

    // Boshqa oynalar yoki qismlar uchun event yuborish
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('appLangChanged', { detail: { key: normalized } }));
    }
  }, []);

  // Til o'zgarganda DOM elementini yangilash
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  // Tashqi o'zgarishlarni (masalan boshqa tabda til o'zgarsa) kuzatish
  useEffect(() => {
    const onExternal = (e) => {
      const nextKey = e?.detail?.key || (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null);
      const next = normalizeLanguageKey(nextKey || DEFAULT_LANGUAGE);
      setLanguageState(next);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('appLangChanged', onExternal);
      window.addEventListener('storage', onExternal);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('appLangChanged', onExternal);
        window.removeEventListener('storage', onExternal);
      }
    };
  }, []);

  /**
   * Context qiymatini hisoblash
   */
  const value = useMemo(() => {
    // createTranslator orqali tr va proxy (t) obyektlarini olamiz
    const { tr, proxy } = createTranslator(translations, language);
    
    return {
      language,
      langKey: language,
      setLanguage,
      setLangKey: setLanguage,
      t: proxy,      // i18n.key yoki t.key ko'rinishida ishlatish uchun
      tr,            // tr('key') ko'rinishida ishlatish uchun
      availableLanguages: getLocalizedLanguages(language),
      currentLanguageMeta: getLanguageMeta(language),
    };
  }, [language, setLanguage]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export default LanguageProvider;