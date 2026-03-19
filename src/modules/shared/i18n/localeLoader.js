import uzLatn from './uz_lotin.json';
import uzKir from './uz_kirill.json';
import qqLatn from './qq_lotin.json';
import qqKir from './qq_kirill.json';
import ru from './ru.json';
import en from './en.json';
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
