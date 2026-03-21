import { useMemo } from 'react';
import { useLanguage } from '@/modules/shared/i18n/useLanguage';
import { translations } from '@i18n/translations';

function normalizeLanguageKey(key) {
  const v = String(key || '').toLowerCase();
  if (v === 'uz_kiril') return 'uz_kirill';
  if (v === 'qq_kiril' || v === 'qq_kir') return 'qq_kirill';
  if (v === 'qq_latin') return 'qq_lotin';
  if (v === 'uz') return 'uz_lotin';
  if (v === 'qq') return 'qq_lotin';
  return translations[v] ? v : 'uz_lotin';
}

export function usePageI18n() {
  const ctx = useLanguage() || {};
  const language = normalizeLanguageKey(ctx.language || ctx.langKey || (typeof localStorage !== 'undefined' ? localStorage.getItem('appLang') : 'uz_lotin'));
  const pageText = useMemo(() => translations[language] || translations.uz_lotin || {}, [language]);
  const tx = (key, fallback = '') => {
    if (typeof ctx.tr === 'function') {
      const value = ctx.tr(key, '');
      if (value && value !== key) return value;
    }
    if (ctx.t && typeof ctx.t === "object" && ctx.t[key]) return ctx.t[key];
    return pageText[key] ?? translations?.uz_lotin?.[key] ?? fallback ?? key;
  };
  return { ...ctx, language, tx, pageText, t: pageText };
}
