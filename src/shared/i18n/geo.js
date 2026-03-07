import { DEFAULT_LANGUAGE } from "./languages";

const SPECIAL = {
  "Qoraqalpogʻiston Respublikasi": {
    uz_lotin: "Qoraqalpogʻiston Respublikasi",
    uz_kirill: "Қорақалпоғистон Республикаси",
    qq_lotin: "Qaraqalpaqstan Respublikası",
    qq_kirill: "Қарақалпақстан Республикасы",
    ru: "Республика Каракалпакстан",
    en: "Republic of Karakalpakstan",
  },
};

const REPL = {
  uz_kirill: [[/shahri/gi,'шаҳри'],[/tumani/gi,'тумани'],[/shahar/gi,'шаҳар'],[/ko‘li|koʻli|ko'li/gi,'кўли']],
  qq_lotin: [[/shahri/gi,'qalası'],[/tumani/gi,'audanı'],[/shahar/gi,'qala'],[/Viloyat/gi,'Walayat'],[/viloyat/gi,'walayat']],
  qq_kirill: [[/shahri/gi,'қаласы'],[/tumani/gi,'аўданы'],[/shahar/gi,'қала'],[/Viloyat/gi,'Ўәлаят'],[/viloyat/gi,'ўәлаят']],
  ru: [[/shahri/gi,'город'],[/tumani/gi,'район'],[/Viloyat/gi,'Область'],[/viloyat/gi,'область']],
  en: [[/shahri/gi,'city'],[/tumani/gi,'district'],[/Viloyat/gi,'Region'],[/viloyat/gi,'region']],
};

function toCyr(text='') {
  return String(text)
    .replace(/oʻ|o‘|o'/gi, 'ў')
    .replace(/gʻ|g‘|g'/gi, 'ғ')
    .replace(/Sh/g, 'Ш').replace(/sh/g, 'ш')
    .replace(/Ch/g, 'Ч').replace(/ch/g, 'ч')
    .replace(/Yo/g, 'Ё').replace(/yo/g, 'ё')
    .replace(/Yu/g, 'Ю').replace(/yu/g, 'ю')
    .replace(/Ya/g, 'Я').replace(/ya/g, 'я')
    .replace(/A/g,'А').replace(/a/g,'а').replace(/B/g,'Б').replace(/b/g,'б').replace(/D/g,'Д').replace(/d/g,'д')
    .replace(/E/g,'Е').replace(/e/g,'е').replace(/F/g,'Ф').replace(/f/g,'ф').replace(/G/g,'Г').replace(/g/g,'г')
    .replace(/H/g,'Ҳ').replace(/h/g,'ҳ').replace(/I/g,'И').replace(/i/g,'и').replace(/J/g,'Ж').replace(/j/g,'ж')
    .replace(/K/g,'К').replace(/k/g,'к').replace(/L/g,'Л').replace(/l/g,'л').replace(/M/g,'М').replace(/m/g,'м')
    .replace(/N/g,'Н').replace(/n/g,'н').replace(/O/g,'О').replace(/o/g,'о').replace(/P/g,'П').replace(/p/g,'п')
    .replace(/Q/g,'Қ').replace(/q/g,'қ').replace(/R/g,'Р').replace(/r/g,'р').replace(/S/g,'С').replace(/s/g,'с')
    .replace(/T/g,'Т').replace(/t/g,'т').replace(/U/g,'У').replace(/u/g,'у').replace(/V/g,'В').replace(/v/g,'в')
    .replace(/X/g,'Х').replace(/x/g,'х').replace(/Y/g,'Й').replace(/y/g,'й').replace(/Z/g,'З').replace(/z/g,'з');
}

export function localizeGeoLabel(value, language = DEFAULT_LANGUAGE) {
  const lang = language || DEFAULT_LANGUAGE;
  const input = String(value || '');
  if (!input) return input;
  if (SPECIAL[input]?.[lang]) return SPECIAL[input][lang];
  let out = input;
  for (const [rx, to] of (REPL[lang] || [])) out = out.replace(rx, to);
  if (lang === 'uz_kirill' || lang === 'qq_kirill') out = toCyr(out);
  return out;
}
