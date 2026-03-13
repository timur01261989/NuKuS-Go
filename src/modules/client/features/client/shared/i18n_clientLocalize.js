import { useMemo } from 'react';
import { useLanguage } from '@/shared/i18n/useLanguage';
import { localizeGeoLabel } from '@/shared/i18n/geo';
import { translatePhrase } from '@/shared/i18n/domPhraseTranslations';

function normalizeLanguageKey(key) {
  const v = String(key || '').toLowerCase();
  if (v === 'uz') return 'uz_lotin';
  if (v === 'qq' || v === 'qq_latin') return 'qq_lotin';
  if (v === 'qq_kir' || v === 'qq_kiril') return 'qq_kirill';
  if (v === 'uz_kiril') return 'uz_kirill';
  return v || 'uz_lotin';
}

export function translateClientGeo(language, text) {
  return localizeGeoLabel(text, normalizeLanguageKey(language));
}

export function translateClientPhrase(language, text, key = '') {
  const lang = normalizeLanguageKey(language);
  if (!text && key) return key;
  const geo = translateClientGeo(lang, text);
  if (geo && geo !== text) return geo;
  return translatePhrase(lang, text);
}

export function formatClientMoney(language, value) {
  if (!Number.isFinite(Number(value))) return '—';
  const lang = normalizeLanguageKey(language);
  const localeMap = {
    uz_lotin: 'uz-UZ',
    uz_kirill: 'uz-Cyrl-UZ',
    qq_lotin: 'uz-UZ',
    qq_kirill: 'kk-Cyrl-KZ',
    ru: 'ru-RU',
    en: 'en-US',
  };
  const unit = translateClientPhrase(lang, "so'm");
  return `${new Intl.NumberFormat(localeMap[lang] || 'uz-UZ').format(Number(value))} ${unit}`;
}

export function useClientText() {
  const langCtx = useLanguage() || {};
  const language = normalizeLanguageKey(langCtx.language || langCtx.langKey || 'uz_lotin');
  const tr = langCtx.tr;
  const t = langCtx.t || {};
  const cp = useMemo(() => (fallback, key) => {
    const translatedByKey = key && typeof tr === 'function' ? tr(key, '') : '';
    if (translatedByKey && translatedByKey !== key) return translatedByKey;
    return translateClientPhrase(language, fallback, key);
  }, [language, tr]);
  return { ...langCtx, language, t, cp };
}
