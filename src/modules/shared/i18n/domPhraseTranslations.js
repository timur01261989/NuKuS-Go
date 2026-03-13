import { translations } from '@i18n/translations';
import { DEFAULT_LANGUAGE, normalizeLanguageKey } from './languages';

const MANUAL_PHRASES = {
  "Qaerga borasiz?": {
    uz_kirill: 'Қаерга борасиз?',
    qq_lotin: 'Qayda barasız?',
    qq_kirill: 'Қайда барасыз?',
    ru: 'Куда поедете?',
    en: 'Where to?',
  },
  "Hozircha saqlangan manzillar yo'q": {
    uz_kirill: 'Ҳозирча сақланган манзиллар йўқ',
    qq_lotin: "Házirge shekem saqlanǵan mánziller joq",
    qq_kirill: 'Ҳәзирге шекем сақланған мәнзиллер жоқ',
    ru: 'Сохранённых адресов пока нет',
    en: 'No saved addresses yet',
  },
  'Xarita': {
    uz_kirill: 'Харита', qq_lotin: 'Xárite', qq_kirill: 'Харите', ru: 'Карта', en: 'Map'
  },
  'Buyurtma yuborilmoqda': {
    uz_kirill: 'Буюртма юборилмоқда', qq_lotin: 'Buyırtpa jiberilmekte', qq_kirill: 'Буйыртпа жиберилмекте', ru: 'Отправка заказа', en: 'Sending order'
  },
  'Yo‘lovchi olish nuqtasi': {
    uz_kirill: 'Йўловчи олиш нуқтаси', qq_lotin: 'Jolawshını alıw noqatı', qq_kirill: 'Жолаўшыны алыў ноқаты', ru: 'Точка посадки пассажира', en: 'Passenger pickup point'
  },
  'Yakuniy nuqta': {
    uz_kirill: 'Якуний нуқта', qq_lotin: 'Aqırǵı noqat', qq_kirill: 'Ақырғы ноқат', ru: 'Конечная точка', en: 'Final point'
  },
  'Manzil aniqlanmoqda...': {
    uz_kirill: 'Манзил аниқланмоқда...', qq_lotin: 'Mánzil anıqlanbaqta...', qq_kirill: 'Мәнзил анықланбақта...', ru: 'Определение адреса...', en: 'Resolving address...'
  },
  'Shahar ichida taksi': {
    uz_kirill: 'Шаҳар ичида такси', qq_lotin: 'Qala ishinde taksi', qq_kirill: 'Қала ишинде такси', ru: 'Городское такси', en: 'City taxi'
  },
  'Viloyatlar aro': {
    uz_kirill: 'Вилоятлар аро', qq_lotin: 'Walayatlar arası', qq_kirill: 'Ўәлаятлар арасы', ru: 'Между областями', en: 'Inter-provincial'
  },
  'Tumanlar aro': {
    uz_kirill: 'Туманлар аро', qq_lotin: 'Rayonlar arası', qq_kirill: 'Районлар арасы', ru: 'Межрайон', en: 'Inter-district'
  },
  'Yuk tashish': {
    uz_kirill: 'Юк ташиш', qq_lotin: 'Júk tasıw', qq_kirill: 'Жүк тасыў', ru: 'Грузоперевозки', en: 'Freight'
  },
  'Eltish xizmati': {
    uz_kirill: 'Элтиш хизмати', qq_lotin: 'Jetkiziw xızmeti', qq_kirill: 'Жеткизиў хизмети', ru: 'Доставка', en: 'Delivery'
  },
  'Mening manzillarim': {
    uz_kirill: 'Менинг манзилларим', qq_lotin: 'Meniń mánzillerim', qq_kirill: 'Мениң мәнзиллерим', ru: 'Мои адреса', en: 'My addresses'
  },
  'Natijalar': {
    uz_kirill: 'Натижалар', qq_lotin: 'Nátiyjeler', qq_kirill: 'Нәтийжелер', ru: 'Результаты', en: 'Results'
  },
  'Tayyor': {
    uz_kirill: 'Тайёр', qq_lotin: 'Tayár', qq_kirill: 'Таяр', ru: 'Готово', en: 'Ready'
  },
  'Masofa belgilangan me\'yoridan ortiq': {
    uz_kirill: 'Масофа белгиланган меъёридан ортиқ', qq_lotin: 'Aralıq belgilengennen artıq', qq_kirill: 'Аралық белгиленгеннен артық', ru: 'Расстояние превышает лимит', en: 'Distance exceeds the limit'
  },
  'Pickup': { uz_kirill: 'Олиш', qq_lotin: 'Alıw', qq_kirill: 'Алыў', ru: 'Посадка', en: 'Pickup' },
  'Destination': { uz_kirill: 'Манзил', qq_lotin: 'Mánzil', qq_kirill: 'Мәнзил', ru: 'Пункт назначения', en: 'Destination' },
};

function normalizeText(value) {
  return String(value || '')
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u02BC`´]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u00A0\u2007\u202F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toUzCyr(text = '') {
  return String(text)
    .replace(/oʻ|o‘|o'/gi, (m) => (m[0] === 'O' ? 'Ў' : 'ў'))
    .replace(/gʻ|g‘|g'/gi, (m) => (m[0] === 'G' ? 'Ғ' : 'ғ'))
    .replace(/sh/gi, (m) => (m[0] === 'S' ? 'Ш' : 'ш'))
    .replace(/ch/gi, (m) => (m[0] === 'C' ? 'Ч' : 'ч'))
    .replace(/yo/gi, (m) => (m[0] === 'Y' ? 'Ё' : 'ё'))
    .replace(/yu/gi, (m) => (m[0] === 'Y' ? 'Ю' : 'ю'))
    .replace(/ya/gi, (m) => (m[0] === 'Y' ? 'Я' : 'я'))
    .replace(/ts/gi, (m) => (m[0] === 'T' ? 'Ц' : 'ц'))
    .replace(/a/g, 'а').replace(/A/g, 'А').replace(/b/g, 'б').replace(/B/g, 'Б')
    .replace(/d/g, 'д').replace(/D/g, 'Д').replace(/e/g, 'е').replace(/E/g, 'Е')
    .replace(/f/g, 'ф').replace(/F/g, 'Ф').replace(/g/g, 'г').replace(/G/g, 'Г')
    .replace(/h/g, 'ҳ').replace(/H/g, 'Ҳ').replace(/i/g, 'и').replace(/I/g, 'И')
    .replace(/j/g, 'ж').replace(/J/g, 'Ж').replace(/k/g, 'к').replace(/K/g, 'К')
    .replace(/l/g, 'л').replace(/L/g, 'Л').replace(/m/g, 'м').replace(/M/g, 'М')
    .replace(/n/g, 'н').replace(/N/g, 'Н').replace(/o/g, 'о').replace(/O/g, 'О')
    .replace(/p/g, 'п').replace(/P/g, 'П').replace(/q/g, 'қ').replace(/Q/g, 'Қ')
    .replace(/r/g, 'р').replace(/R/g, 'Р').replace(/s/g, 'с').replace(/S/g, 'С')
    .replace(/t/g, 'т').replace(/T/g, 'Т').replace(/u/g, 'у').replace(/U/g, 'У')
    .replace(/v/g, 'в').replace(/V/g, 'В').replace(/x/g, 'х').replace(/X/g, 'Х')
    .replace(/y/g, 'й').replace(/Y/g, 'Й').replace(/z/g, 'з').replace(/Z/g, 'З');
}

function qqWordReplacements(text = '') {
  const rules = [
    [/\bQayerga\b/gi, 'Qayda'],
    [/\bQayerdan\b/gi, 'Qayerdan'],
    [/\bborasiz\b/gi, 'barasız'],
    [/\bsaqlangan\b/gi, 'saqlanǵan'],
    [/\bmanzillar\b/gi, 'mánziller'],
    [/\byo'q\b|\byo‘q\b|\byoq\b/gi, 'joq'],
    [/\bBuyurtma\b/gi, 'Buyırtpa'],
    [/\byuborilmoqda\b/gi, 'jiberilmekte'],
    [/\bHaydovchi\b/gi, 'Aydawshı'],
    [/\bqidirilmoqda\b/gi, 'izlenbekte'],
    [/\bYo'lovchi\b|\bYo‘lovchi\b/gi, 'Jolawshı'],
    [/\bolish\b/gi, 'alıw'],
    [/\bnuqtasi\b/gi, 'noqatı'],
    [/\bYakuniy\b/gi, 'Aqırǵı'],
    [/\bXarita\b/gi, 'Xárite'],
    [/\bShahar\b/gi, 'Qala'],
    [/\bViloyatlar\b/gi, 'Walayatlar'],
    [/\bTumanlar\b/gi, 'Rayonlar'],
    [/\bYuk tashish\b/gi, 'Júk tasıw'],
    [/\bEltish xizmati\b/gi, 'Jetkiziw xızmeti'],
    [/\bMening\b/gi, 'Meniń'],
    [/\bNatijalar\b/gi, 'Nátiyjeler'],
    [/\bTayyor\b/gi, 'Tayár'],
  ];
  let out = String(text);
  for (const [rx, to] of rules) out = out.replace(rx, to);
  return out;
}

function toQqLatin(text = '') {
  return qqWordReplacements(String(text))
    .replace(/oʻ|o‘|o'/gi, (m) => (m[0] === 'O' ? 'Ó' : 'ó'))
    .replace(/gʻ|g‘|g'/gi, (m) => (m[0] === 'G' ? 'Ǵ' : 'ǵ'))
    .replace(/ng/gi, (m) => (m[0] === 'N' ? 'Ń' : 'ń'))
    .replace(/ya/gi, (m) => (m[0] === 'Y' ? 'Ya' : 'ya'))
    .replace(/yu/gi, (m) => (m[0] === 'Y' ? 'Yu' : 'yu'))
    .replace(/yo/gi, (m) => (m[0] === 'Y' ? 'Yo' : 'yo'));
}

function toQqCyr(text = '') {
  return toQqLatin(text)
    .replace(/Sh/g, 'Ш').replace(/sh/g, 'ш')
    .replace(/Ch/g, 'Ч').replace(/ch/g, 'ч')
    .replace(/Ya/g, 'Я').replace(/ya/g, 'я')
    .replace(/Yu/g, 'Ю').replace(/yu/g, 'ю')
    .replace(/Yo/g, 'Ё').replace(/yo/g, 'ё')
    .replace(/A/g, 'А').replace(/a/g, 'а').replace(/Á/g,'Ә').replace(/á/g,'ә')
    .replace(/B/g, 'Б').replace(/b/g, 'б').replace(/D/g, 'Д').replace(/d/g, 'д')
    .replace(/E/g, 'Е').replace(/e/g, 'е').replace(/F/g, 'Ф').replace(/f/g, 'ф')
    .replace(/G/g, 'Г').replace(/g/g, 'г').replace(/Ǵ/g,'Ғ').replace(/ǵ/g,'ғ')
    .replace(/H/g, 'Х').replace(/h/g, 'х').replace(/I/g, 'И').replace(/i/g, 'и')
    .replace(/Í/g,'И').replace(/í/g,'и').replace(/J/g, 'Ж').replace(/j/g, 'ж')
    .replace(/K/g, 'К').replace(/k/g, 'к').replace(/Q/g, 'Қ').replace(/q,? /g, 'қ ')
    .replace(/q/g,'қ').replace(/L/g, 'Л').replace(/l/g, 'л').replace(/M/g, 'М').replace(/m/g, 'м')
    .replace(/N/g, 'Н').replace(/n/g, 'н').replace(/Ń/g,'Ң').replace(/ń/g,'ң')
    .replace(/O/g, 'О').replace(/o/g, 'о').replace(/Ó/g,'Ө').replace(/ó/g,'ө')
    .replace(/P/g, 'П').replace(/p/g, 'п').replace(/R/g, 'Р').replace(/r/g, 'р')
    .replace(/S/g, 'С').replace(/s/g, 'с').replace(/T/g, 'Т').replace(/t/g, 'т')
    .replace(/U/g, 'У').replace(/u/g, 'у').replace(/Ú/g,'Ү').replace(/ú/g,'ү')
    .replace(/V/g, 'В').replace(/v/g, 'в').replace(/W/g, 'Ў').replace(/w/g, 'ў')
    .replace(/X/g, 'Х').replace(/x/g, 'х').replace(/Y/g, 'Й').replace(/y/g, 'й')
    .replace(/Z/g, 'З').replace(/z/g, 'з');
}

function getHeuristicTranslation(language, text) {
  const normalized = normalizeText(text);
  if (!normalized) return text;
  if (language === 'uz_kirill') return toUzCyr(normalized);
  if (language === 'qq_lotin') return toQqLatin(normalized);
  if (language === 'qq_kirill') return toQqCyr(normalized);
  return normalized;
}

function buildPhraseIndex() {
  const index = new Map();
  const localeKeys = Object.keys(translations || {});

  const addEntry = (source, targets) => {
    const norm = normalizeText(source);
    if (!norm) return;
    index.set(norm, { ...(index.get(norm) || {}), ...targets });
  };

  Object.entries(MANUAL_PHRASES).forEach(([source, targetMap]) => addEntry(source, targetMap));

  const allKeys = new Set();
  localeKeys.forEach((lang) => Object.keys(translations[lang] || {}).forEach((k) => allKeys.add(k)));

  allKeys.forEach((key) => {
    const variants = {};
    for (const lang of localeKeys) {
      const value = translations[lang]?.[key];
      if (typeof value === 'string' && normalizeText(value)) variants[lang] = value;
    }
    const targets = {};
    for (const lang of localeKeys) {
      if (variants[lang]) targets[lang] = variants[lang];
    }
    Object.values(variants).forEach((sourceValue) => addEntry(sourceValue, targets));
  });

  return index;
}

const PHRASE_INDEX = buildPhraseIndex();

export function translatePhrase(language, text) {
  const lang = normalizeLanguageKey(language || DEFAULT_LANGUAGE);
  const original = String(text ?? '');
  const normalized = normalizeText(original);
  if (!normalized || lang === DEFAULT_LANGUAGE) return original;

  const direct = PHRASE_INDEX.get(normalized)?.[lang];
  if (direct) return original.replace(normalized, direct);

  for (const [source, targets] of PHRASE_INDEX.entries()) {
    if (!targets?.[lang]) continue;
    if (normalized.toLowerCase() === source.toLowerCase()) return targets[lang];
    if (normalized.toLowerCase().includes(source.toLowerCase())) {
      const rx = new RegExp(escapeRegExp(source), 'gi');
      const replaced = normalized.replace(rx, targets[lang]);
      if (replaced !== normalized) return replaced;
    }
  }

  return getHeuristicTranslation(lang, original);
}
