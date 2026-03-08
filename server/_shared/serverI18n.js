const DICT = {
  uz_lotin: {},
  uz_kirill: {
    "Method not allowed": "Методга рухсат берилмаган",
    "Server error": "Сервер хатоси",
    "Unknown driver route": "Номаълум ҳайдовчи йўли",
    "Authorization Bearer token topilmadi": "Authorization Bearer токени топилмади",
    "Token noto‘g‘ri yoki eskirgan": "Токен нотўғри ёки эскирган",
    "driver_id token user_id bilan mos emas": "driver_id токендаги user_id билан мос эмас",
    "driver_id kerak": "driver_id керак",
    "driver_presence yangilanmadi": "driver_presence янгиланмади",
    "Telefon raqam noto'g'ri": "Телефон рақами нотўғри",
    "session_id kerak": "session_id керак",
    "OTP noto'g'ri": "OTP нотўғри",
    "Missing required fields": "Керакли майдонлар етишмаяпти",
    "from_location and to_location are required": "from_location ва to_location керак",
    "Order not found": "Буюртма топилмади",
    "Forbidden": "Тақиқланган",
    "Requester is not a participant of this order": "Сўровчи ушбу буюртма иштирокчиси эмас",
    "Other party not assigned yet": "Иккинчи томон ҳали бириктирилмаган",
    "passenger_id missing": "passenger_id йўқ",
    "driver_id missing": "driver_id йўқ",
    "Phone not found": "Телефон рақами топилмади",
    "No phone field found for the other party": "Иккинчи томон учун телефон майдони топилмади",
    "Server misconfigured: SUPABASE_URL is missing": "Сервер нотўғри созланган: SUPABASE_URL йўқ",
    "Add SUPABASE_URL in Vercel Environment Variables": "Vercel Environment Variables ичига SUPABASE_URL қўшинг",
    "Server misconfigured: no Supabase key found": "Сервер нотўғри созланган: Supabase калити топилмади",
    "Set SUPABASE_SERVICE_ROLE_KEY (recommended) or SUPABASE_ANON_KEY in Vercel": "Vercel ичида SUPABASE_SERVICE_ROLE_KEY (тавсия) ёки SUPABASE_ANON_KEY ни ўрнатинг",
    "A server error has occurred": "Сервер хатоси юз берди",
    "user_id missing": "user_id йўқ",
    "to_status/status kerak": "to_status/status керак",
    "Order topilmadi": "Буюртма топилмади",
    "Transition not allowed": "Ҳолатни алмаштиришга рухсат йўқ",
    "Unauthorized": "Рухсат берилмаган",
    "Invalid token": "Нотўғри токен",
    "Not enough balance": "Баланс етарли эмас",
    "amount_uzs noto'g'ri": "amount_uzs нотўғри",
    "payment_id kerak": "payment_id керак",
    "Not verified (callback signature tekshirilmagan)": "Тасдиқланмаган (callback signature текширилмаган)",
    "Payment not found": "Тўлов топилмади",
    "ad_id kerak": "ad_id керак",
    "promo_type kerak": "promo_type керак",
    "promo_type noto'g'ri": "promo_type нотўғри",
    "Balans yetarli emas": "Баланс етарли эмас",
    "Unknown callback provider": "Номаълум callback провайдер",
    "Unknown auto-market route": "Номаълум auto-market йўли",
    "lat/lng kerak": "lat/lng керак",
    "pickup lat/lng kerak (body.pickup yoki orders.pickup)": "pickup lat/lng керак (body.pickup ёки orders.pickup)",
    "lat/lng noto'g'ri": "lat/lng нотўғри",
    "distance_km noto'g'ri": "distance_km нотўғри",
    "speed_kmh noto'g'ri": "speed_kmh нотўғри",
    "base_eta_seconds noto'g'ri": "base_eta_seconds нотўғри",
    "order_id kerak": "order_id керак",
    "action accept|reject": "action accept|reject бўлиши керак",
    "sender_user_id kerak": "sender_user_id керак",
    "body bo'sh": "body бўш",
    "id kerak": "id керак",
    "user_id kerak": "user_id керак",
    "account ids required": "account id лар керак",
    "amount must be > 0": "amount 0 дан катта бўлиши керак",
    "driver_id required": "driver_id керак",
    "user_id required": "user_id керак",
    "role required": "role керак",
    "fcm_token required": "fcm_token керак",
    "body required": "body керак",
    "Supabase env missing": "Supabase env йўқ",
    "thread_id, sender_role, message required": "thread_id, sender_role, message керак",
    "thread_id required": "thread_id керак",
    "Unknown support action": "Номаълум support амали",
    "log_id required": "log_id керак",
    "Unknown voip action": "Номаълум voip амали",
    "final_price_uzs noto'g'ri": "final_price_uzs нотўғри"
  },
  qq_kirill: {
    "Method not allowed": "Методқа рухсат жоқ",
    "Server error": "Сервер қатеси",
    "Missing required fields": "Керекли майданлар жетиспейди",
    "Order not found": "Заказ табылмады",
    "Phone not found": "Телефон табылмады",
    "Forbidden": "Тыйым салынған",
    "Unauthorized": "Рухсат жоқ",
    "Invalid token": "Қәте токен",
    "Not enough balance": "Баланс жеткиликсиз"
  },
  ru: {
    "Method not allowed": "Метод не разрешен",
    "Server error": "Ошибка сервера",
    "Missing required fields": "Не хватает обязательных полей",
    "Order not found": "Заказ не найден",
    "Phone not found": "Телефон не найден",
    "Forbidden": "Доступ запрещен",
    "Unauthorized": "Нет доступа",
    "Invalid token": "Неверный токен",
    "Not enough balance": "Недостаточно баланса"
  },
  en: {}
};

function normalizeLang(lang) {
  const v = String(lang || '').trim().toLowerCase();
  if (!v) return 'uz_lotin';
  if (v in DICT) return v;
  if (v.includes('qq') && v.includes('kir')) return 'qq_kirill';
  if (v.includes('uz') && v.includes('kir')) return 'uz_kirill';
  if (v.startsWith('ru')) return 'ru';
  if (v.startsWith('en')) return 'en';
  if (v.startsWith('qq')) return 'qq_latin';
  if (v.startsWith('uz')) return 'uz_lotin';
  return 'uz_lotin';
}

export function getRequestLang(req, body = null) {
  const q = req?.query?.appLang || req?.query?.lang || null;
  const b = body?.appLang || body?.lang || req?.body?.appLang || req?.body?.lang || null;
  const h = req?.headers?.['x-app-lang'] || req?.headers?.['x-language'] || req?.headers?.['accept-language'] || null;
  return normalizeLang(q || b || h);
}

export function tServer(lang, text) {
  if (typeof text !== 'string') return text;
  const dict = DICT[normalizeLang(lang)] || {};
  return dict[text] || text;
}

export function translatePayload(payload, lang) {
  if (payload == null) return payload;
  if (typeof payload === 'string') return tServer(lang, payload);
  if (Array.isArray(payload)) return payload.map((v) => translatePayload(v, lang));
  if (typeof payload !== 'object') return payload;
  const out = {};
  for (const [k, v] of Object.entries(payload)) {
    if (["error", "message", "hint", "details"].includes(k) && typeof v === 'string') out[k] = tServer(lang, v);
    else out[k] = translatePayload(v, lang);
  }
  return out;
}
