import qq from "./qq";
import uz from "./uz";
import ru from "./ru";
import en from "./en";

export const LOCALES = { qq, uz, ru, en };

export function t(lang, path, fallback = "") {
  const dict = LOCALES[lang] || LOCALES.uz;
  const parts = String(path || "").split(".");
  let cur = dict;
  for (const p of parts) cur = cur?.[p];
  return cur ?? fallback ?? path;
}
