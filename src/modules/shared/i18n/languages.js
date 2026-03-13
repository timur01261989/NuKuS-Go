export const DEFAULT_LANGUAGE = 'uz_lotin';

export const AVAILABLE_LANGUAGES = [
  { key: 'uz_lotin', nativeLabel: "O'zbekcha (Lotin)", englishLabel: 'Uzbek (Latin)', dir: 'ltr' },
  { key: 'uz_kirill', nativeLabel: 'Ўзбекча (Кирилл)', englishLabel: 'Uzbek (Cyrillic)', dir: 'ltr' },
  { key: 'qq_lotin', nativeLabel: 'Qaraqalpaqsha (Latın)', englishLabel: 'Karakalpak (Latin)', dir: 'ltr' },
  { key: 'qq_kirill', nativeLabel: 'Қарақалпақша (Кирилл)', englishLabel: 'Karakalpak (Cyrillic)', dir: 'ltr' },
  { key: 'ru', nativeLabel: 'Русский', englishLabel: 'Russian', dir: 'ltr' },
  { key: 'en', nativeLabel: 'English', englishLabel: 'English', dir: 'ltr' },
];

export const languages = AVAILABLE_LANGUAGES.map((x) => x.key);

const ALIAS = {
  uz: 'uz_lotin',
  uzbek: 'uz_lotin',
  uz_latn: 'uz_lotin',
  uz_latin: 'uz_lotin',
  uz_kiril: 'uz_kirill',
  uz_cyrillic: 'uz_kirill',
  uz_cyrillics: 'uz_kirill',
  qq: 'qq_lotin',
  kaa: 'qq_lotin',
  qq_latn: 'qq_lotin',
  qq_latin: 'qq_lotin',
  qq_kir: 'qq_kirill',
  qq_kiril: 'qq_kirill',
  qq_cyrillic: 'qq_kirill',
  karakalpak: 'qq_lotin',
  qoraqalpoq: 'qq_lotin',
  qoraqalpoqcha: 'qq_lotin',
  qaraqalpaqsha: 'qq_lotin',
  russian: 'ru',
  english: 'en',
};

export function normalizeLanguageKey(key) {
  const raw = String(key || '').trim().toLowerCase().replace(/[-\s]/g, '_');
  if (!raw) return DEFAULT_LANGUAGE;
  return languages.includes(raw) ? raw : (ALIAS[raw] || DEFAULT_LANGUAGE);
}

export function getLanguageMeta(key) {
  const normalized = normalizeLanguageKey(key);
  return AVAILABLE_LANGUAGES.find((x) => x.key === normalized) || AVAILABLE_LANGUAGES[0];
}

function labelsByUiLanguage() {
  return {
    uz_lotin: {
      uz_lotin: "O'zbekcha (Lotin)",
      uz_kirill: 'Ўзбекча (Кирилл)',
      qq_lotin: 'Qaraqalpaqsha (Latın)',
      qq_kirill: 'Қарақалпақша (Кирилл)',
      ru: 'Русский',
      en: 'English',
    },
    uz_kirill: {
      uz_lotin: "Ўзбекча (Лотин)",
      uz_kirill: 'Ўзбекча (Кирилл)',
      qq_lotin: 'Қорақалпоқча (Лотин)',
      qq_kirill: 'Қорақалпоқча (Кирилл)',
      ru: 'Русский',
      en: 'English',
    },
    qq_lotin: {
      uz_lotin: "Ózbekshe (Latın)",
      uz_kirill: 'Өзбекше (Кирилл)',
      qq_lotin: 'Qaraqalpaqsha (Latın)',
      qq_kirill: 'Қарақалпақша (Кирилл)',
      ru: 'Русский',
      en: 'English',
    },
    qq_kirill: {
      uz_lotin: 'Өзбекше (Латын)',
      uz_kirill: 'Өзбекше (Кирилл)',
      qq_lotin: 'Қарақалпақша (Латын)',
      qq_kirill: 'Қарақалпақша (Кирилл)',
      ru: 'Русский',
      en: 'English',
    },
    ru: {
      uz_lotin: 'Узбекский (латиница)',
      uz_kirill: 'Узбекский (кириллица)',
      qq_lotin: 'Каракалпакский (латиница)',
      qq_kirill: 'Каракалпакский (кириллица)',
      ru: 'Русский',
      en: 'English',
    },
    en: {
      uz_lotin: 'Uzbek (Latin)',
      uz_kirill: 'Uzbek (Cyrillic)',
      qq_lotin: 'Karakalpak (Latin)',
      qq_kirill: 'Karakalpak (Cyrillic)',
      ru: 'Russian',
      en: 'English',
    },
  };
}

export function getLocalizedLanguageLabel(key, uiLanguage = DEFAULT_LANGUAGE) {
  const current = normalizeLanguageKey(uiLanguage);
  const lang = normalizeLanguageKey(key);
  const labelMap = labelsByUiLanguage()[current] || labelsByUiLanguage()[DEFAULT_LANGUAGE];
  return labelMap[lang] || getLanguageMeta(lang).nativeLabel;
}

export function getLocalizedLanguages(uiLanguage = DEFAULT_LANGUAGE) {
  const current = normalizeLanguageKey(uiLanguage);
  return AVAILABLE_LANGUAGES.map((lang) => ({
    ...lang,
    label: getLocalizedLanguageLabel(lang.key, current),
  }));
}
