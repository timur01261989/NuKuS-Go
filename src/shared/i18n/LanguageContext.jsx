import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { translations } from "@i18n/translations";
import i18n from "i18next";

// UniGo uchun yagona kalit
const STORAGE_KEY = "unigo_lang";

// Loyiha ichida eski tarjimalar (uz_lotin, qq_lotin, ru, en) bor.
// Biz foydalanuvchiga 4 ta asosiy til kodini ko'rsatamiz.
const MAP = {
  uz: "uz_lotin",
  qk: "qq_lotin",
  ru: "ru",
  en: "en",
};

function normalizeLang(raw) {
  const v = String(raw || "").toLowerCase();
  return MAP[v] ? v : "uz";
}

export const LanguageContext = createContext({
  langKey: "uz",
  setLangKey: (_k) => {},
  t: translations.uz_lotin || {},
});

export function LanguageProvider({ children }) {
  const [langKey, setLangKeyState] = useState(() => normalizeLang(localStorage.getItem(STORAGE_KEY)));

  const setLangKey = useCallback((key) => {
    const next = normalizeLang(key);
    setLangKeyState(next);
    localStorage.setItem(STORAGE_KEY, next);
    // i18next ham sinxron bo'lsin (React i18n'dan foydalansangiz)
    try { i18n.changeLanguage(next); } catch {}
    // same-tab listeners
    window.dispatchEvent(new CustomEvent("unigoLangChanged", { detail: { key: next } }));
  }, []);

  useEffect(() => {
    const onExternal = (e) => {
      const k = normalizeLang(e?.detail?.key || localStorage.getItem(STORAGE_KEY));
      setLangKeyState(k);
      try { i18n.changeLanguage(k); } catch {}
    };
    window.addEventListener("unigoLangChanged", onExternal);
    return () => window.removeEventListener("unigoLangChanged", onExternal);
  }, []);

  const value = useMemo(() => {
    const dictKey = MAP[langKey] || "uz_lotin";
    const t = translations[dictKey] || translations.uz_lotin || {};
    return { langKey, setLangKey, t };
  }, [langKey, setLangKey]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
