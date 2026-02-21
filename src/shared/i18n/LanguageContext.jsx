import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { translations } from "@i18n/translations";

const STORAGE_KEY = "appLang";

export const LanguageContext = createContext({
  langKey: "uz_lotin",
  setLangKey: (_k) => {},
  t: translations.uz_lotin || {},
});

export function LanguageProvider({ children }) {
  const [langKey, setLangKeyState] = useState(() => localStorage.getItem(STORAGE_KEY) || "uz_lotin");

  const setLangKey = useCallback((key) => {
    setLangKeyState(key);
    localStorage.setItem(STORAGE_KEY, key);
    // same-tab listeners
    window.dispatchEvent(new CustomEvent("appLangChanged", { detail: { key } }));
  }, []);

  useEffect(() => {
    const onExternal = (e) => {
      const k = e?.detail?.key || localStorage.getItem(STORAGE_KEY) || "uz_lotin";
      setLangKeyState(k);
    };
    window.addEventListener("appLangChanged", onExternal);
    return () => window.removeEventListener("appLangChanged", onExternal);
  }, []);

  const value = useMemo(() => {
    const t = translations[langKey] || translations.uz_lotin || {};
    return { langKey, setLangKey, t };
  }, [langKey, setLangKey]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
