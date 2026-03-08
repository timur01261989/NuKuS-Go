// src/shared/i18n/languages.js

export const LANGUAGES = {
  UZ: 'uz',
  RU: 'ru',
  EN: 'en'
};

export const DEFAULT_LANGUAGE = LANGUAGES.UZ;

/**
 * Tillar haqidagi asosiy ma'lumotlar
 */
export const AVAILABLE_LANGUAGES = [
  { key: LANGUAGES.UZ, label: "O'zbekcha", flag: "🇺🇿", nativeName: "O'zbek" },
  { key: LANGUAGES.RU, label: "Русский", flag: "🇷🇺", nativeName: "Русский" },
  { key: LANGUAGES.EN, label: "English", flag: "🇺🇸", nativeName: "English" }
];

/**
 * Kelgan til kalitini tekshirib, tizimda borligiga ishonch hosil qiladi
 */
export const normalizeLanguageKey = (key) => {
  const values = Object.values(LANGUAGES);
  return values.includes(key) ? key : DEFAULT_LANGUAGE;
};

/**
 * Til kaliti bo'yicha uning ob'ektini (meta-ma'lumotini) topadi
 */
export const getLanguageMeta = (key) => {
  const normalized = normalizeLanguageKey(key);
  return AVAILABLE_LANGUAGES.find(lang => lang.key === normalized) || AVAILABLE_LANGUAGES[0];
};

/**
 * Settings.jsx dagi xatoni tuzatuvchi asosiy funksiya.
 * Til kodiga qarab (masalan 'uz') uning nomini ('O'zbekcha') qaytaradi.
 */
export const getLocalizedLanguageLabel = (key, _currentLang = null) => {
  const meta = getLanguageMeta(key);
  return meta ? meta.label : key;
};

/**
 * Mavjud tillar ro'yxatini qaytaradi
 */
export const getLocalizedLanguages = (_currentLang = null) => {
  return AVAILABLE_LANGUAGES;
};

export default {
  LANGUAGES,
  DEFAULT_LANGUAGE,
  AVAILABLE_LANGUAGES,
  normalizeLanguageKey,
  getLanguageMeta,
  getLocalizedLanguageLabel,
  getLocalizedLanguages
};