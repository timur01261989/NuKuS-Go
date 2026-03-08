// src/shared/i18n/createTranslator.js
import { DEFAULT_LANGUAGE } from './languages';

/**
 * Ob'ekt ichidan nuqta orqali ajratilgan yo'l bo'yicha qiymatni olish (masalan: 'user.name')
 */
function deepGet(obj, path) {
  if (!obj || !path) return undefined;
  return String(path)
    .split('.')
    .reduce((acc, key) => (acc && Object.prototype.hasOwnProperty.call(acc, key) ? acc[key] : undefined), obj);
}

/**
 * Tarjimon funksiyasini yaratuvchi asosiy funksiya
 * @param {Object} translations - Barcha tillardagi tarjimalar ob'ekti
 * @param {string} language - Tanlangan joriy til
 */
export function createTranslator(translations, language) {
  // Tanlangan til bo'yicha tarjimalar yoki default til bo'yicha tarjimalar
  const current = translations?.[language] || translations?.[DEFAULT_LANGUAGE] || {};
  const fallback = translations?.[DEFAULT_LANGUAGE] || {};

  /**
   * tr funksiyasi - kalit so'z bo'yicha tarjimani qaytaradi
   */
  const tr = (path, fallbackValue = '') => {
    // 1. To'g'ridan-to'g'ri kalitni tekshirish
    const direct = current?.[path];
    if (typeof direct !== 'undefined') return direct;

    // 2. Ichma-ich joylashgan (nested) kalitni tekshirish
    const currentNested = deepGet(current, path);
    if (typeof currentNested !== 'undefined') return currentNested;

    // 3. Zaxira tilda (fallback) to'g'ridan-to'g'ri tekshirish
    const fallbackDirect = fallback?.[path];
    if (typeof fallbackDirect !== 'undefined') return fallbackDirect;

    // 4. Zaxira tilda ichma-ich joylashgan kalitni tekshirish
    const fallbackNested = deepGet(fallback, path);
    if (typeof fallbackNested !== 'undefined') return fallbackNested;

    // 5. Hech narsa topilmasa fallbackValue yoki kalitning o'zini qaytarish
    return fallbackValue || path;
  };

  /**
   * Proxy ob'ekti orqali tarjimalarga to'g'ridan-to'g'ri murojaat qilish imkoniyati
   */
  const proxy = new Proxy(current, {
    get(target, prop) {
      if (prop === '__raw') return current;
      if (prop === '__fallback') return fallback;
      if (typeof prop !== 'string') return target[prop];
      
      // Agar joriy tilda xususiyat bo'lsa
      if (Object.prototype.hasOwnProperty.call(target, prop)) return target[prop];
      
      // Agar zaxira tilda bo'lsa
      if (Object.prototype.hasOwnProperty.call(fallback, prop)) return fallback[prop];
      
      // Topilmasa xususiyat nomini qaytarish
      return prop;
    },
  });

  return { tr, proxy };
}

export default createTranslator;