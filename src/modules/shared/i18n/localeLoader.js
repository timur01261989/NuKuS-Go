const uzLatn = "./uz_lotin.json";
const uzKir = "./uz_kirill.json";
const qqLatn = "./qq_lotin.json";
const qqKir = "./qq_kirill.json";
const ru = "./ru.json";
const en = "./en.json";
import { DEFAULT_LANGUAGE } from './languages';

export const translations = {
  uz_lotin: uzLatn,
  uz_kirill: uzKir,
  qq_lotin: qqLatn,
  qq_kirill: qqKir,
  ru,
  en,
};

export function getLocaleDictionary(language) {
  return translations[language] || translations[DEFAULT_LANGUAGE] || {};
}

export default translations;
