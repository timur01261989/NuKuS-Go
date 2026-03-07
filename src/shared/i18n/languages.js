export const AVAILABLE_LANGUAGES = [
  { key: 'uz_lotin', label: "O'zbek (Lotin)", shortLabel: 'UZ' },
  { key: 'uz_kirill', label: 'Ўзбек (Кирилл)', shortLabel: 'ЎЗ' },
  { key: 'qq_lotin', label: 'Qaraqalpaq (Lotin)', shortLabel: 'QQ' },
  { key: 'qq_kirill', label: 'Қарақалпақ (Кирилл)', shortLabel: 'ҚҚ' },
  { key: 'ru', label: 'Русский', shortLabel: 'RU' },
  { key: 'en', label: 'English', shortLabel: 'EN' },
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
