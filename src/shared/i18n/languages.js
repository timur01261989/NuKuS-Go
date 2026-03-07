export const AVAILABLE_LANGUAGES = [
  {
    key: 'uz_lotin',
    shortLabel: 'UZ',
    labels: {
      uz_lotin: "O'zbek (Lotin)",
      uz_kirill: "Ўзбекча (Лотин)",
      qq_lotin: "Ózbek (Latın)",
      qq_kirill: "Өзбек (Латын)",
      ru: 'Узбекский (латиница)',
      en: 'Uzbek (Latin)',
    },
  },
  {
    key: 'uz_kirill',
    shortLabel: 'ЎЗ',
    labels: {
      uz_lotin: "O'zbek (Kirill)",
      uz_kirill: 'Ўзбек (Кирилл)',
      qq_lotin: 'Ózbek (Kirill)',
      qq_kirill: 'Өзбек (Кирилл)',
      ru: 'Узбекский (кириллица)',
      en: 'Uzbek (Cyrillic)',
    },
  },
  {
    key: 'qq_lotin',
    shortLabel: 'QQ',
    labels: {
      uz_lotin: 'Qoraqalpoq (Lotin)',
      uz_kirill: 'Қорақалпоқ (Лотин)',
      qq_lotin: 'Qaraqalpaq (Lotin)',
      qq_kirill: 'Қарақалпақ (Лотын)',
      ru: 'Каракалпакский (латиница)',
      en: 'Karakalpak (Latin)',
    },
  },
  {
    key: 'qq_kirill',
    shortLabel: 'ҚҚ',
    labels: {
      uz_lotin: 'Qoraqalpoq (Kirill)',
      uz_kirill: 'Қорақалпоқ (Кирилл)',
      qq_lotin: 'Qaraqalpaq (Kirill)',
      qq_kirill: 'Қарақалпақ (Кирилл)',
      ru: 'Каракалпакский (кириллица)',
      en: 'Karakalpak (Cyrillic)',
    },
  },
  {
    key: 'ru',
    shortLabel: 'RU',
    labels: {
      uz_lotin: 'Rus tili',
      uz_kirill: 'Рус тили',
      qq_lotin: 'Rus tili',
      qq_kirill: 'Рус тили',
      ru: 'Русский',
      en: 'Russian',
    },
  },
  {
    key: 'en',
    shortLabel: 'EN',
    labels: {
      uz_lotin: 'Ingliz tili',
      uz_kirill: 'Инглиз тили',
      qq_lotin: 'Inglis tili',
      qq_kirill: 'Инглис тили',
      ru: 'Английский',
      en: 'English',
    },
  },
];

export const DEFAULT_LANGUAGE = 'uz_lotin';

export function isSupportedLanguage(key) {
  return AVAILABLE_LANGUAGES.some((lang) => lang.key === key);
}

export function normalizeLanguageKey(key) {
  return isSupportedLanguage(key) ? key : DEFAULT_LANGUAGE;
}

export function getLanguageMeta(key) {
  return AVAILABLE_LANGUAGES.find((lang) => lang.key === key) || AVAILABLE_LANGUAGES[0];
}

export function getLocalizedLanguageLabel(languageKey, uiLanguage = DEFAULT_LANGUAGE) {
  const meta = getLanguageMeta(languageKey);
  return meta?.labels?.[uiLanguage] || meta?.labels?.[DEFAULT_LANGUAGE] || languageKey;
}

export function getLocalizedLanguages(uiLanguage = DEFAULT_LANGUAGE) {
  return AVAILABLE_LANGUAGES.map((lang) => ({
    ...lang,
    label: getLocalizedLanguageLabel(lang.key, uiLanguage),
  }));
}
