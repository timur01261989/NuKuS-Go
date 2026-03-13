import { useMemo } from "react";
import { useLanguage } from "@/modules/shared/i18n/useLanguage";
import { t as localeT } from "./locales";

function mapGlobalToAutoLocale(language) {
  if (!language) return "uz";
  if (language.startsWith("ru")) return "ru";
  if (language.startsWith("en")) return "en";
  if (language.startsWith("qq")) return "qq";
  return "uz";
}

export function useAutoMarketI18n() {
  const { language } = useLanguage();
  const locale = useMemo(() => mapGlobalToAutoLocale(language), [language]);
  const am = (path, fallback = "") => localeT(locale, path, fallback || path);
  return { locale, am, appLanguage: language };
}
