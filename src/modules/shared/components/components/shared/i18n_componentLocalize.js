import { translations } from '../../i18n/translations';
import { UZ_REGIONS } from '../../constants/uzLocations';

export function getComponentLang() {
  try {
    const v = localStorage.getItem('appLang') || localStorage.getItem('language') || 'uz_lotin';
    return translations[v] ? v : 'uz_lotin';
  } catch {
    return 'uz_lotin';
  }
}

export function ct(key, fallback = '') {
  const lang = getComponentLang();
  return translations?.[lang]?.[key] ?? translations?.uz_lotin?.[key] ?? fallback;
}

const regionKeyMap = {
  "Qoraqalpog‘iston": 'qq_region',
  'Andijon': 'and_region',
  'Buxoro': 'bux_region',
  'Farg‘ona': 'far_region',
  'Jizzax': 'jiz_region',
  'Namangan': 'nam_region',
  'Navoiy': 'nav_region',
  'Qashqadaryo': 'qas_region',
  'Samarqand': 'sam_region',
  'Surxondaryo': 'sur_region',
  'Sirdaryo': 'sir_region',
  'Toshkent viloyati': 'tosh_region',
  'Toshkent shahri': 'tsh_region',
  'Xorazm': 'xor_region',
};

const districtKeyMap = {
  'Nukus shahri': 'nukus',
  'Chimboy': 'chimboy',
  'Qo‘ng‘irot': 'qongirot',
  'Beruniy': 'beruniy',
  'To‘rtko‘l': 'tortkol',
  'Mo‘ynoq': 'moynoq',
  'Xo‘jayli': 'xojayli',
  'Shumanay': 'shumanay',
  'Qanliko‘l': 'qanlikol',
  'Kegeyli': 'kegeyli',
  'Qorao‘zak': 'qoraozak',
  'Taxtako‘pir': 'taxtakopir',
};

const cyrMap = {
  "A":"А","B":"Б","D":"Д","E":"Е","F":"Ф","G":"Г","H":"Ҳ","I":"И","J":"Ж","K":"К","L":"Л","M":"М","N":"Н","O":"О","P":"П","Q":"Қ","R":"Р","S":"С","T":"Т","U":"У","V":"В","X":"Х","Y":"Й","Z":"З","a":"а","b":"б","d":"д","e":"е","f":"ф","g":"г","h":"ҳ","i":"и","j":"ж","k":"к","l":"л","m":"м","n":"н","o":"о","p":"п","q":"қ","r":"р","s":"с","t":"т","u":"у","v":"в","x":"х","y":"й","z":"з",
  "O‘":"Ў","o‘":"ў","G‘":"Ғ","g‘":"ғ","Sh":"Ш","sh":"ш","Ch":"Ч","ch":"ч","Yo":"Ё","yo":"ё","Ya":"Я","ya":"я","Yu":"Ю","yu":"ю","Ng":"Нг","ng":"нг","‘":"'","ʻ":"'"
};

function latinToCyrillic(text = '') {
  let out = text;
  const digraphs = ['O‘','o‘','G‘','g‘','Sh','sh','Ch','ch','Yo','yo','Ya','ya','Yu','yu','Ng','ng','ʻ','‘'];
  for (const d of digraphs) out = out.split(d).join(cyrMap[d] || d);
  return [...out].map(ch => cyrMap[ch] || ch).join('');
}

export function localizeGeoLabel(label) {
  if (!label) return label;
  const lang = getComponentLang();
  const key = regionKeyMap[label] || districtKeyMap[label];
  if (key && translations?.[lang]?.[key]) return translations[lang][key];
  if (lang === 'uz_kirill' || lang === 'qq_kirill') return latinToCyrillic(label);
  return label;
}

export function getLocalizedRegions() {
  return UZ_REGIONS.map((r) => ({ ...r, localizedName: localizeGeoLabel(r.name) }));
}

export function getLocalizedDistricts(regionId) {
  const region = UZ_REGIONS.find((r) => r.id === regionId);
  return (region?.districts || []).map((name) => ({ value: name, label: localizeGeoLabel(name) }));
}
