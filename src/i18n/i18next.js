import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import { translations } from "./translations";

// 4 ta asosiy til (sizning talabingiz bo'yicha)
export const SUPPORTED_LANGS = ["qk", "uz", "ru", "en"];
export const STORAGE_KEY = "unigo_lang";

function normalizeLang(raw) {
  if (!raw) return null;
  const v = String(raw).toLowerCase();
  if (SUPPORTED_LANGS.includes(v)) return v;
  return null;
}

// Mavjud translations.js (uz_lotin, qq_lotin, ru, en) ni i18next resources formatiga moslaymiz.
const resources = {
  uz: { translation: translations.uz_lotin || {} },
  qk: { translation: translations.qq_lotin || {} },
  ru: { translation: translations.ru || {} },
  en: { translation: translations.en || {} },
};

const saved = normalizeLang(typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null);

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: saved || "uz",
    fallbackLng: "uz",
    interpolation: { escapeValue: false },
    // Bizning translations objectlar flat key'larda (greeting, login, ...)
    // shuning uchun keySeparator kerak emas.
    keySeparator: false,
    returnEmptyString: false,
  });

export default i18n;
