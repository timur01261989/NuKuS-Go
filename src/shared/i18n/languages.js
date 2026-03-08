// src/shared/i18n/languages.js

export const LANGUAGES = {
  UZ: 'uz',
  RU: 'ru',
  EN: 'en'
};

export const DEFAULT_LANGUAGE = LANGUAGES.UZ;

// Barcha tillar haqida metadata
export const AVAILABLE_LANGUAGES = [
  { key: LANGUAGES.UZ, label: "O'zbekcha", flag: "🇺🇿", nativeName: "O'zbek" },
  { key: LANGUAGES.RU, label: "Русский", flag: "🇷🇺", nativeName: "Русский" },
  { key: LANGUAGES.EN, label: "English", flag: "🇺🇸", nativeName: "English" }
];

/**
 * Til kalitini normallashtirish (noto'g'ri kalit bo'lsa default qaytaradi)
 */
export const normalizeLanguageKey = (key) => {
  const values = Object.values(LANGUAGES);
  return values.includes(key) ? key : DEFAULT_LANGUAGE;
};

/**
 * Berilgan tilning barcha ma'lumotlarini olish
 */
export const getLanguageMeta = (key) => {
  const normalized = normalizeLanguageKey(key);
  return AVAILABLE_LANGUAGES.find(lang => lang.key === normalized) || AVAILABLE_LANGUAGES[0];
};

/**
 * Mahalliy tillar ro'yxatini olish (kerak bo'lsa tarjima qilingan holda)
 */
export const getLocalizedLanguages = (currentLang) => {
  // Bu yerda mantiqni o'zingizga moslab kengaytirishingiz mumkin
  return AVAILABLE_LANGUAGES;
};

export default {
  LANGUAGES,
  DEFAULT_LANGUAGE,
  AVAILABLE_LANGUAGES,
  normalizeLanguageKey,
  getLanguageMeta,
  getLocalizedLanguages
};