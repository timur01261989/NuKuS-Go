import { t as localeT } from "./locales";

export function createAmHelpers(locale, am) {
  const tr = (path, fallback="") => am ? am(path, fallback) : localeT(locale, path, fallback || path);
  const mapLabel = (type, raw) => {
    if (!raw) return raw;
    const key = String(raw);
    return tr(`static.${type}.${key}`, raw);
  };
  return {
    tr,
    fuelLabel: (v) => mapLabel('fuels', v),
    transmissionLabel: (v) => mapLabel('transmissions', v),
    colorLabel: (v) => mapLabel('colors', v),
    zapConditionLabel: (v) => mapLabel('zapConditions', v),
  };
}
