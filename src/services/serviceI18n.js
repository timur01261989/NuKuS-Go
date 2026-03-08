const FALLBACK_LANG = 'uz_lotin';

function normalizeLang(raw) {
  const v = String(raw || '').trim().toLowerCase();
  if (!v) return FALLBACK_LANG;
  if (v === 'uz') return 'uz_lotin';
  if (v === 'qq') return 'qq_lotin';
  if (v === 'en-us') return 'en';
  if (v === 'ru-ru') return 'ru';
  return v;
}

export function getServiceLang() {
  try {
    return normalizeLang(localStorage.getItem('appLang'));
  } catch {
    return FALLBACK_LANG;
  }
}

const TEXT = {
  currency_uzs: {
    uz_lotin: "so'm",
    uz_kirill: "сўм",
    qq_lotin: "som",
    qq_kirill: "сом",
    ru: 'сум',
    en: 'UZS',
  },
  night_tariff: {
    uz_lotin: 'Tun tarifi',
    uz_kirill: 'Тун тарифи',
    qq_lotin: 'Tun tarifi',
    qq_kirill: 'Түн тарифи',
    ru: 'Ночной тариф',
    en: 'Night tariff',
  },
  pricing_api_error: {
    uz_lotin: 'Pricing API xatosi',
    uz_kirill: 'Pricing API хатоси',
    qq_lotin: 'Pricing API qateligi',
    qq_kirill: 'Pricing API қәтелиғи',
    ru: 'Ошибка Pricing API',
    en: 'Pricing API error',
  },
  baseline_profile_ready: {
    uz_lotin: 'Baseline Profile: Muhim resurslar ustuvorligi belgilandi.',
    uz_kirill: 'Baseline Profile: Муҳим ресурслар устуворлиги белгиланди.',
    qq_lotin: 'Baseline Profile: Mańizli resurslar ústinligi belgilenedi.',
    qq_kirill: 'Baseline Profile: Маңызлы ресурслар үстинлиги белгиленеди.',
    ru: 'Baseline Profile: приоритет важных ресурсов установлен.',
    en: 'Baseline Profile: important assets have been prioritized.',
  },
  image_compress_error: {
    uz_lotin: 'Kichraytirishda xato:',
    uz_kirill: 'Кичрайтиришда хато:',
    qq_lotin: 'Qısqartıwda qatelik:',
    qq_kirill: 'Қысқартыўда қәтелик:',
    ru: 'Ошибка при сжатии:',
    en: 'Compression error:',
  },
};

export function serviceT(key, lang = getServiceLang()) {
  const table = TEXT[key] || {};
  return table[lang] || table[FALLBACK_LANG] || key;
}

export function formatMoneyUZS(value, lang = getServiceLang()) {
  const amount = Number(value || 0);
  const localeMap = {
    uz_lotin: 'uz-UZ',
    uz_kirill: 'uz-Cyrl-UZ',
    qq_lotin: 'uz-UZ',
    qq_kirill: 'kk-Cyrl-KZ',
    ru: 'ru-RU',
    en: 'en-US',
  };
  const locale = localeMap[lang] || 'uz-UZ';
  const suffix = serviceT('currency_uzs', lang);
  try {
    return `${new Intl.NumberFormat(locale).format(amount)} ${suffix}`;
  } catch {
    return `${amount} ${suffix}`;
  }
}
