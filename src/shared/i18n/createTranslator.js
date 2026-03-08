import { DEFAULT_LANGUAGE } from './languages';

function deepGet(obj, path) {
  if (!obj || !path) return undefined;
  return String(path)
    .split('.')
    .reduce((acc, key) => (acc && Object.prototype.hasOwnProperty.call(acc, key) ? acc[key] : undefined), obj);
}

export function createTranslator(translations, language) {
  const current = translations?.[language] || translations?.[DEFAULT_LANGUAGE] || {};
  const fallback = translations?.[DEFAULT_LANGUAGE] || {};

  const tr = (path, fallbackValue = '') => {
    const direct = current?.[path];
    if (typeof direct !== 'undefined') return direct;

    const currentNested = deepGet(current, path);
    if (typeof currentNested !== 'undefined') return currentNested;

    const fallbackDirect = fallback?.[path];
    if (typeof fallbackDirect !== 'undefined') return fallbackDirect;

    const fallbackNested = deepGet(fallback, path);
    if (typeof fallbackNested !== 'undefined') return fallbackNested;

    return fallbackValue || path;
  };

  const proxy = new Proxy(current, {
    get(target, prop) {
      if (prop === '__raw') return current;
      if (prop === '__fallback') return fallback;
      if (typeof prop !== 'string') return target[prop];
      if (Object.prototype.hasOwnProperty.call(target, prop)) return target[prop];
      if (Object.prototype.hasOwnProperty.call(fallback, prop)) return fallback[prop];
      return prop;
    },
  });

  return { tr, proxy };
}
