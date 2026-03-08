// src/shared/i18n/languages.js

// Tizimda qo'llaniladigan tillar kodlari
export const LANGUAGES = {
  UZ: 'uz',
  RU: 'ru',
  EN: 'en'
};

// Asosiy til (DEFAULT_LANGUAGE) ni eksport qilamiz
// Bu createTranslator.js dagi import xatosini to'g'irlaydi
export const DEFAULT_LANGUAGE = LANGUAGES.UZ;

// Barcha qo'llab-quvvatlanadigan tillar ro'yxati
export const SUPPORTED_LANGUAGES = [
  LANGUAGES.UZ,
  LANGUAGES.RU,
  LANGUAGES.EN
];

// Default eksport sifatida barchasini jamlab qaytaramiz
export default {
  LANGUAGES,
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES
};