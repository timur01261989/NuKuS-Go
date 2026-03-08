import { useMemo } from 'react';
import { useLanguage } from '@/shared/i18n/useLanguage';
import { translatePhrase } from '@/shared/i18n/domPhraseTranslations';

function normalizeLanguageKey(key) {
  const v = String(key || '').toLowerCase();
  if (v === 'uz') return 'uz_lotin';
  if (v === 'qq' || v === 'qq_latin') return 'qq_lotin';
  if (v === 'qq_kir' || v === 'qq_kiril') return 'qq_kirill';
  if (v === 'uz_kiril') return 'uz_kirill';
  return v || 'uz_lotin';
}

export function translateDriverPhrase(language, text, key = '') {
  return translatePhrase(normalizeLanguageKey(language), text || key);
}

export function useDriverText() {
  const langCtx = useLanguage() || {};
  const language = normalizeLanguageKey(langCtx.language || langCtx.langKey || 'uz_lotin');
  const tr = langCtx.tr;
  const cp = useMemo(() => (fallback, key) => {
    const translatedByKey = key && typeof tr === 'function' ? tr(key, '') : '';
    if (translatedByKey && translatedByKey !== key) return translatedByKey;
    return translateDriverPhrase(language, fallback, key);
  }, [language, tr]);
  return { ...langCtx, language, cp };
}
