/**
 * settingsService.js — Sozlamalar persistentlik qatlami
 *
 * DOCX tavsiyasi: Settings localStoragega to'g'ridan-to'g'ri bog'liq.
 * Bu servis localStorage o'qish/yozishni markazlashtiradi va
 * kelajakda server-backed preferences ga o'tishni osonlashtiradi.
 *
 * Afzalliklari:
 *  - Barcha sozlamalar bir konstantada
 *  - JSON parse xatolari yutilmaydi — fallback qaytariladi
 *  - Kelajakda supabase.from('user_preferences') ga almashtiriladi
 */

const KEYS = {
  NIGHT_MODE:     'unigo_nightMode',
  NOTIFICATIONS:  'unigo_notificationsEnabled',
  LANGUAGE:       'unigo_language',
  MAP_STYLE:      'unigo_mapStyle',
};

const DEFAULTS = {
  [KEYS.NIGHT_MODE]:    'auto',
  [KEYS.NOTIFICATIONS]: '1',
  [KEYS.LANGUAGE]:      'uz_latn',
  [KEYS.MAP_STYLE]:     'default',
};

function safeGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, String(value));
    return true;
  } catch {
    return false;
  }
}

export const settingsService = {
  getNightMode()        { return safeGet(KEYS.NIGHT_MODE)    || DEFAULTS[KEYS.NIGHT_MODE]; },
  setNightMode(v)       { safeSet(KEYS.NIGHT_MODE, v); window.dispatchEvent(new Event('nightModeChanged')); },

  getNotifications()    { return safeGet(KEYS.NOTIFICATIONS) !== '0'; },
  setNotifications(v)   { safeSet(KEYS.NOTIFICATIONS, v ? '1' : '0'); },

  getLanguage()         { return safeGet(KEYS.LANGUAGE)      || DEFAULTS[KEYS.LANGUAGE]; },
  setLanguage(v)        { safeSet(KEYS.LANGUAGE, v); },

  getMapStyle()         { return safeGet(KEYS.MAP_STYLE)     || DEFAULTS[KEYS.MAP_STYLE]; },
  setMapStyle(v)        { safeSet(KEYS.MAP_STYLE, v); },

  /** Barcha sozlamalarni o'chirish (logout paytida chaqirilsin) */
  clearAll()            {
    Object.values(KEYS).forEach(k => { try { localStorage.removeItem(k); } catch {} });
  },

  KEYS,
};

export default settingsService;
