import { useMemo } from 'react';
import { useLanguage } from '@/modules/shared/i18n/useLanguage.js';

const numberFormatters = new Map();

function getCurrencyFormatter(language) {
  const locale = String(language || 'uz_lotin').replaceAll('_', '-');
  const key = `currency:${locale}`;
  if (!numberFormatters.has(key)) {
    numberFormatters.set(
      key,
      new Intl.NumberFormat(locale, {
        maximumFractionDigits: 0,
      }),
    );
  }
  return numberFormatters.get(key);
}

export function formatClientMoney(language, amount) {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) {
    return '—';
  }
  try {
    return `${getCurrencyFormatter(language).format(numeric)} so'm`;
  } catch {
    return `${Math.round(numeric)} so'm`;
  }
}

export function translateClientPhrase(languageOrTranslator, phrase, key) {
  const fallback = typeof phrase === 'string' && phrase.trim() ? phrase : key || '';

  if (languageOrTranslator && typeof languageOrTranslator === 'function') {
    const resolved = languageOrTranslator(key || fallback, fallback);
    return typeof resolved === 'string' && resolved.trim() ? resolved : fallback;
  }

  return fallback;
}

export function useClientText() {
  const { language, t, tr } = useLanguage();

  return useMemo(() => {
    const cp = (phrase, key) => translateClientPhrase(tr, phrase, key);
    return {
      language,
      t,
      tr,
      cp,
    };
  }, [language, t, tr]);
}

export default useClientText;
