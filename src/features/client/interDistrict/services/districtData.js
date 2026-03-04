/**
 * districtData.js
 * -------------------------------------------------------
 * Hududlar (viloyatlar) va tumanlar koordinatalari (lat/lng).
 *
 * Muhim:
 * - Client tumanlar aro ishlashi uchun: region -> districtlar ro‘yxati kerak.
 * - O'zbekiston Respublikasining barcha tuman va shaharlari to'liq kiritildi.
 */

import { haversineKm } from "../../shared/geo/haversine";

// Backward-compat: some modules import { haversineKm } from this file.
export { haversineKm };

/** Hududlar (viloyatlar) */
export const REGIONS = [
  { id: "karakalpakstan", name: "Qoraqalpog‘iston" },
  { id: "tashkent_city", name: "Toshkent shahri" },
  { id: "tashkent_region", name: "Toshkent viloyati" },
  { id: "andijan", name: "Andijon" },
  { id: "bukhara", name: "Buxoro" },
  { id: "fergana", name: "Farg‘ona" },
  { id: "jizzakh", name: "Jizzax" },
  { id: "khorezm", name: "Xorazm" },
  { id: "namangan", name: "Namangan" },
  { id: "navoiy", name: "Navoiy" },
  { id: "kashkadarya", name: "Qashqadaryo" },
  { id: "samarkand", name: "Samarqand" },
  { id: "sirdarya", name: "Sirdaryo" },
  { id: "surkhandarya", name: "Surxondaryo" },
];

/**
 * Barcha hududlarning to'liq tumanlari ro'yxati.
 */
export const DISTRICTS_BY_REGION = {
  karakalpakstan: [
    { id: "nukus", name: "Nukus shahri", lat: 42.4617, lng: 59.6166 },
    { id: "amudaryo", name: "Amudaryo tumani", lat: 42.0175, lng: 60.0010 },
    { id: "beruniy", name: "Beruniy tumani", lat: 41.6917, lng: 60.7520 },
    { id: "bozatov", name: "Bo'zatov tumani", lat: 43.0000, lng: 59.0000 },
    { id: "chimboy", name: "Chimboy tumani", lat: 42.9410, lng: 59.7690 },
    { id: "ellikqala", name: "Ellikqal'a tumani", lat: 41.8480, lng: 60.9300 },
    { id: "kegeyli", name: "Kegeyli tumani", lat: 42.7760, lng: 59.6050 },
    { id: "moynoq", name: "Mo'ynoq tumani", lat: 43.7680, lng: 59.0220 },
    { id: "nukus_district", name: "Nukus tumani (Oqmang'it)", lat: 42.5660, lng: 59.5660 },
    { id: "qanlikol", name: "Qanliko'l tumani", lat: 42.8250, lng: 59.0330 },
    { id: "konirat", name: "Qo'ng'irot tumani", lat: 43.0520, lng: 58.8530 },
    { id: "qoraozak", name: "Qorao'zak tumani", lat: 43.0160, lng: 60.0330 },
    { id: "shumanay", name: "Shumanay tumani", lat: 42.6160, lng: 59.2000 },
    { id: "taxiatosh", name: "Taxiatosh tumani", lat: 42.3500, lng: 59.5660 },
    { id: "taxtakopir", name: "Taxtako'pir tumani", lat: 43.0330, lng: 60.2830 },
    { id: "turtkul", name: "To'rtko'l tumani", lat: 41.5500, lng: 61.0167 },
    { id: "khodjeyli", name: "Xo'jayli tumani", lat: 42.4042, lng: 59.4403 },
  ],
  tashkent_city: [
    { id: "tashkent", name: "Toshkent shahri", lat: 41.2995, lng: 69.2401 },
    { id: "bektemir", name: "Bektemir tumani", lat: 41.2290, lng: 69.3230 },
    { id: "chilonzor", name: "Chilonzor tumani", lat: 41.2697, lng: 69.2041 },
    { id: "mirobod", name: "Mirobod tumani", lat: 41.2880, lng: 69.2840 },
    { id: "mirzo_ulugbek", name: "Mirzo Ulug'bek tumani", lat: 41.3320, lng: 69.3240 },
    { id: "olmazor", name: "Olmazor tumani", lat: 41.3500, lng: 69.2220 },
    { id: "sergeli", name: "Sergeli tumani", lat: 41.2240, lng: 69.2200 },
    { id: "shayxontohur", name: "Shayxontohur tumani", lat: 41.3280, lng: 69.2310 },
    { id: "uchtepa", name: "Uchtepa tumani", lat: 41.2850, lng: 69.1720 },
    { id: "yakkasaroy", name: "Yakkasaroy tumani", lat: 41.2750, lng: 69.2450 },
    { id: "yashnobod", name: "Yashnobod tumani", lat: 41.2910, lng: 69.3320 },
    { id: "yunusobod", name: "Yunusobod tumani", lat: 41.3670, lng: 69.2860 },
    { id: "yangihayot", name: "Yangihayot tumani", lat: 41.1960, lng: 69.2150 },
  ],
  tashkent_region: [
    { id: "nurafshon", name: "Nurafshon shahri", lat: 41.0400, lng: 69.3560 },
    { id: "olmaliq", name: "Olmaliq shahri", lat: 40.8440, lng: 69.5987 },
    { id: "angren", name: "Angren shahri", lat: 41.0167, lng: 70.1436 },
    { id: "bekobod_city", name: "Bekobod shahri", lat: 40.2190, lng: 69.2680 },
    { id: "chirchiq", name: "Chirchiq shahri", lat: 41.4680, lng: 69.5820 },
    { id: "ohangaron_city", name: "Ohangaron shahri", lat: 40.9060, lng: 69.6380 },
    { id: "yangiyol_city", name: "Yangiyo'l shahri", lat: 41.1160, lng: 69.0490 },
    { id: "bekobod_district", name: "Bekobod tumani", lat: 40.3540, lng: 69.1980 },
    { id: "bostonliq", name: "Bo'stonliq tumani", lat: 41.6550, lng: 70.1060 },
    { id: "boka", name: "Bo'ka tumani", lat: 40.8110, lng: 69.1980 },
    { id: "chinoz", name: "Chinoz tumani", lat: 40.9400, lng: 68.7610 },
    { id: "qibray", name: "Qibray tumani", lat: 41.3850, lng: 69.4560 },
    { id: "ohangaron_district", name: "Ohangaron tumani", lat: 40.9500, lng: 69.7500 },
    { id: "oqqorgon", name: "Oqqo'rg'on tumani", lat: 40.8790, lng: 69.0490 },
    { id: "parkent", name: "Parkent tumani", lat: 41.2950, lng: 69.6760 },
    { id: "piskent", name: "Piskent tumani", lat: 40.8950, lng: 69.3500 },
    { id: "quyi_chirchiq", name: "Quyi Chirchiq tumani", lat: 40.9410, lng: 68.9950 },
    { id: "orta_chirchiq", name: "O'rta Chirchiq tumani", lat: 41.0660, lng: 69.2450 },
    { id: "yangiyol_district", name: "Yangiyo'l tumani", lat: 41.1000, lng: 68.9800 },
    { id: "yuqori_chirchiq", name: "Yuqori Chirchiq tumani", lat: 41.3110, lng: 69.4880 },
    { id: "zangiota", name: "Zangiota tumani", lat: 41.1890, lng: 69.1550 },
    { id: "toshkent_district", name: "Toshkent tumani", lat: 41.4000, lng: 69.1800 },
  ],
  andijan: [
    { id: "andijan_city", name: "Andijon shahri", lat: 40.7821, lng: 72.3442 },
    { id: "xonobod", name: "Xonobod shahri", lat: 40.8030, lng: 73.0030 },
    { id: "andijan_district", name: "Andijon tumani", lat: 40.8330, lng: 72.3160 },
    { id: "asaka", name: "Asaka tumani", lat: 40.6415, lng: 72.2396 },
    { id: "baliqchi", name: "Baliqchi tumani", lat: 40.9260, lng: 71.9360 },
    { id: "boston_and", name: "Bo'ston (Bo'z) tumani", lat: 40.6660, lng: 71.8660 },
    { id: "buloqboshi", name: "Buloqboshi tumani", lat: 40.6160, lng: 72.4830 },
    { id: "izboskan", name: "Izboskan tumani", lat: 40.8830, lng: 72.2660 },
    { id: "jalaquduq", name: "Jalaquduq tumani", lat: 40.7330, lng: 72.6330 },
    { id: "marhamat", name: "Marhamat tumani", lat: 40.5000, lng: 72.3330 },
    { id: "oltinkol", name: "Oltinko'l tumani", lat: 40.8000, lng: 72.1660 },
    { id: "paxtaobod", name: "Paxtaobod tumani", lat: 40.9330, lng: 72.4830 },
    { id: "qorgontepa", name: "Qo'rg'ontepa tumani", lat: 40.7330, lng: 72.7660 },
    { id: "shahrixon", name: "Shahrixon tumani", lat: 40.7133, lng: 72.0574 },
    { id: "ulugnor", name: "Ulug'nor tumani", lat: 40.8160, lng: 71.7330 },
    { id: "xojaobod", name: "Xo'jaobod tumani", lat: 40.6660, lng: 72.5660 },
  ],
  bukhara: [
    { id: "bukhara_city", name: "Buxoro shahri", lat: 39.7670, lng: 64.4230 },
    { id: "kogon_city", name: "Kogon shahri", lat: 39.7210, lng: 64.5500 },
    { id: "bukhara_district", name: "Buxoro tumani", lat: 39.8160, lng: 64.4160 },
    { id: "gijduvon", name: "G‘ijduvon tumani", lat: 40.1000, lng: 64.6830 },
    { id: "jondor", name: "Jondor tumani", lat: 39.7330, lng: 64.1830 },
    { id: "kogon_district", name: "Kogon tumani", lat: 39.6830, lng: 64.5830 },
    { id: "olot", name: "Olot tumani", lat: 39.4160, lng: 63.8000 },
    { id: "peshku", name: "Peshku tumani", lat: 40.0660, lng: 64.2160 },
    { id: "karakul", name: "Qorako‘l tumani", lat: 39.5333, lng: 63.8500 },
    { id: "qorovulbozor", name: "Qorovulbozor tumani", lat: 39.5000, lng: 64.8000 },
    { id: "romitan", name: "Romitan tumani", lat: 39.9330, lng: 64.3830 },
    { id: "shofirkon", name: "Shofirkon tumani", lat: 40.1160, lng: 64.4500 },
    { id: "vobkent", name: "Vobkent tumani", lat: 40.0160, lng: 64.5160 },
  ],
  fergana: [
    { id: "fergana_city", name: "Farg‘ona shahri", lat: 40.3893, lng: 71.7876 },
    { id: "margilan", name: "Marg‘ilon shahri", lat: 40.4724, lng: 71.7246 },
    { id: "qoqon_city", name: "Qo'qon shahri", lat: 40.5300, lng: 70.9380 },
    { id: "quvasoy", name: "Quvasoy shahri", lat: 40.2972, lng: 71.9794 },
    { id: "bogdod", name: "Bog'dod tumani", lat: 40.5000, lng: 71.2160 },
    { id: "beshariq", name: "Beshariq tumani", lat: 40.4330, lng: 70.6160 },
    { id: "buvayda", name: "Buvayda tumani", lat: 40.6000, lng: 71.1330 },
    { id: "dangara", name: "Dang'ara tumani", lat: 40.5830, lng: 70.8330 },
    { id: "fergana_district", name: "Farg'ona tumani", lat: 40.2330, lng: 71.7660 },
    { id: "furqat", name: "Furqat tumani", lat: 40.4500, lng: 70.7660 },
    { id: "oltiariq", name: "Oltiariq tumani", lat: 40.3830, lng: 71.4830 },
    { id: "qoshtepa", name: "Qo'shtepa tumani", lat: 40.5330, lng: 71.6160 },
    { id: "quva", name: "Quva tumani", lat: 40.4660, lng: 72.0660 },
    { id: "rishton", name: "Rishton tumani", lat: 40.3500, lng: 71.2830 },
    { id: "sox", name: "So'x tumani", lat: 39.9500, lng: 71.1330 },
    { id: "toshloq", name: "Toshloq tumani", lat: 40.5160, lng: 71.8330 },
    { id: "uchkoprik", name: "Uchko'prik tumani", lat: 40.5500, lng: 71.0500 },
    { id: "ozbekiston", name: "O'zbekiston tumani", lat: 40.3660, lng: 70.8160 },
    { id: "yozovon", name: "Yozovon tumani", lat: 40.6500, lng: 71.6660 },
  ],
  jizzakh: [
    { id: "jizzakh_city", name: "Jizzax shahri", lat: 40.1158, lng: 67.8422 },
    { id: "arnasoy", name: "Arnasoy tumani", lat: 40.6660, lng: 67.9500 },
    { id: "baxmal", name: "Baxmal tumani", lat: 39.7500, lng: 67.9160 },
    { id: "dustlik", name: "Do‘stlik tumani", lat: 40.5420, lng: 68.0430 },
    { id: "forish", name: "Forish tumani", lat: 40.5500, lng: 67.2000 },
    { id: "gallaorol", name: "G'allaorol tumani", lat: 40.0160, lng: 67.5830 },
    { id: "sharof_rashidov", name: "Sharof Rashidov tumani", lat: 40.1660, lng: 67.8000 },
    { id: "mirzachol", name: "Mirzacho'l tumani", lat: 40.6500, lng: 68.2000 },
    { id: "paxtakor", name: "Paxtakor tumani", lat: 40.3160, lng: 67.9500 },
    { id: "yangiobod", name: "Yangiobod tumani", lat: 39.9160, lng: 68.6500 },
    { id: "zafarobod", name: "Zafarobod tumani", lat: 40.3500, lng: 67.8330 },
    { id: "zarbdor", name: "Zarbdor tumani", lat: 40.0830, lng: 68.1660 },
    { id: "zomin", name: "Zomin tumani", lat: 39.9600, lng: 68.3950 },
  ],
  khorezm: [
    { id: "urganch", name: "Urganch shahri", lat: 41.5500, lng: 60.6333 },
    { id: "khiva", name: "Xiva shahri", lat: 41.3890, lng: 60.3420 },
    { id: "bogot", name: "Bog'ot tumani", lat: 41.3500, lng: 60.8160 },
    { id: "gurlan", name: "Gurlan tumani", lat: 41.8330, lng: 60.4000 },
    { id: "xonqa", name: "Xonqa tumani", lat: 41.4500, lng: 60.7830 },
    { id: "hazorasp", name: "Hazorasp tumani", lat: 41.3200, lng: 61.0750 },
    { id: "xiva_district", name: "Xiva tumani", lat: 41.3660, lng: 60.3000 },
    { id: "qoshkopir", name: "Qo'shko'pir tumani", lat: 41.5330, lng: 60.3660 },
    { id: "shovot", name: "Shovot tumani", lat: 41.6660, lng: 60.3000 },
    { id: "urganch_district", name: "Urganch tumani", lat: 41.5830, lng: 60.6500 },
    { id: "yangiariq", name: "Yangiariq tumani", lat: 41.4000, lng: 60.5830 },
    { id: "yangibozor", name: "Yangibozor tumani", lat: 41.7330, lng: 60.5500 },
    { id: "tuproqqala", name: "Tuproqqal'a tumani", lat: 41.2500, lng: 61.2000 },
  ],
  namangan: [
    { id: "namangan_city", name: "Namangan shahri", lat: 40.9983, lng: 71.6726 },
    { id: "chortoq", name: "Chortoq tumani", lat: 41.0670, lng: 71.8230 },
    { id: "chust", name: "Chust tumani", lat: 41.0010, lng: 71.2380 },
    { id: "kosonsoy", name: "Kosonsoy tumani", lat: 41.2500, lng: 71.5500 },
    { id: "mingbuloq", name: "Mingbuloq tumani", lat: 40.8500, lng: 71.2500 },
    { id: "namangan_district", name: "Namangan tumani", lat: 40.9500, lng: 71.6830 },
    { id: "norin", name: "Norin tumani", lat: 40.8830, lng: 71.9830 },
    { id: "pop", name: "Pop tumani", lat: 40.8660, lng: 71.1000 },
    { id: "toraqorgon", name: "To'raqo'rg'on tumani", lat: 41.0000, lng: 71.5160 },
    { id: "uchqorgon", name: "Uchqo'rg'on tumani", lat: 41.1160, lng: 72.0660 },
    { id: "uychi", name: "Uychi tumani", lat: 41.0330, lng: 71.8330 },
    { id: "yangiqorgon", name: "Yangiqo'rg'on tumani", lat: 41.1830, lng: 71.7160 },
    { id: "davlatobod", name: "Davlatobod tumani", lat: 40.9700, lng: 71.6300 },
    { id: "yangi_namangan", name: "Yangi Namangan tumani", lat: 41.0100, lng: 71.6500 },
  ],
  navoiy: [
    { id: "navoiy_city", name: "Navoiy shahri", lat: 40.0844, lng: 65.3792 },
    { id: "zarafshon", name: "Zarafshon shahri", lat: 41.5820, lng: 64.2100 },
    { id: "gozgon", name: "G'ozg'on shahri", lat: 40.4830, lng: 65.5500 },
    { id: "karmana", name: "Karmana tumani", lat: 40.1360, lng: 65.3600 },
    { id: "konimex", name: "Konimex tumani", lat: 40.3000, lng: 65.1330 },
    { id: "navbahor", name: "Navbahor tumani", lat: 40.1660, lng: 65.1830 },
    { id: "nurota", name: "Nurota tumani", lat: 40.5660, lng: 65.6830 },
    { id: "qiziltepa", name: "Qiziltepa tumani", lat: 40.0330, lng: 64.8330 },
    { id: "tomdi", name: "Tomdi tumani", lat: 41.7660, lng: 64.6160 },
    { id: "uchquduq", name: "Uchquduq tumani", lat: 42.1500, lng: 63.5500 },
    { id: "xatirchi", name: "Xatirchi tumani", lat: 40.1500, lng: 65.9660 },
  ],
  kashkadarya: [
    { id: "qarshi", name: "Qarshi shahri", lat: 38.8606, lng: 65.7847 },
    { id: "shahrisabz", name: "Shahrisabz shahri", lat: 39.0578, lng: 66.8340 },
    { id: "chiroqchi", name: "Chiroqchi tumani", lat: 39.0330, lng: 66.5660 },
    { id: "dehqonobod", name: "Dehqonobod tumani", lat: 38.2000, lng: 66.3330 },
    { id: "guzar", name: "G‘uzor tumani", lat: 38.6200, lng: 66.2500 },
    { id: "qamashi", name: "Qamashi tumani", lat: 38.8000, lng: 66.4500 },
    { id: "qarshi_district", name: "Qarshi tumani", lat: 38.8830, lng: 65.7330 },
    { id: "koson", name: "Koson tumani", lat: 39.0330, lng: 65.5830 },
    { id: "kasbi", name: "Kasbi tumani", lat: 38.9330, lng: 65.4160 },
    { id: "kitob", name: "Kitob tumani", lat: 39.1160, lng: 66.8830 },
    { id: "mirishkor", name: "Mirishkor tumani", lat: 38.8330, lng: 65.0000 },
    { id: "muborak", name: "Muborak tumani", lat: 39.2500, lng: 65.1500 },
    { id: "nishon", name: "Nishon tumani", lat: 38.6500, lng: 65.6830 },
    { id: "shahrisabz_district", name: "Shahrisabz tumani", lat: 39.0160, lng: 66.8160 },
    { id: "yakkabog", name: "Yakkabog' tumani", lat: 38.9830, lng: 66.6830 },
    { id: "kokdala", name: "Ko'kdala tumani", lat: 39.1500, lng: 66.0000 },
  ],
  samarkand: [
    { id: "samarkand_city", name: "Samarqand shahri", lat: 39.6542, lng: 66.9597 },
    { id: "kattaqorgon_city", name: "Kattaqo‘rg‘on shahri", lat: 39.8990, lng: 66.2580 },
    { id: "bulungur", name: "Bulung'ur tumani", lat: 39.7500, lng: 67.2660 },
    { id: "ishtixon", name: "Ishtixon tumani", lat: 39.9660, lng: 66.4830 },
    { id: "jomboy", name: "Jomboy tumani", lat: 39.6830, lng: 67.0830 },
    { id: "kattaqorgon_district", name: "Kattaqo'rg'on tumani", lat: 39.9160, lng: 66.2330 },
    { id: "qoshrabot", name: "Qo'shrabot tumani", lat: 40.3500, lng: 66.4500 },
    { id: "narpay", name: "Narpay tumani", lat: 39.9660, lng: 65.8830 },
    { id: "nurobod", name: "Nurobod tumani", lat: 39.3000, lng: 66.2660 },
    { id: "oqdaryo", name: "Oqdaryo tumani", lat: 39.8330, lng: 66.8000 },
    { id: "paxtachi", name: "Paxtachi tumani", lat: 40.0330, lng: 65.6500 },
    { id: "payariq", name: "Payariq tumani", lat: 39.9830, lng: 66.8660 },
    { id: "pastdargom", name: "Pastdarg'om tumani", lat: 39.6000, lng: 66.6660 },
    { id: "samarkand_district", name: "Samarqand tumani", lat: 39.5830, lng: 66.9330 },
    { id: "tayloq", name: "Tayloq tumani", lat: 39.5660, lng: 67.0660 },
    { id: "urgut", name: "Urgut tumani", lat: 39.4040, lng: 67.2430 },
  ],
  sirdarya: [
    { id: "guliston", name: "Guliston shahri", lat: 40.4907, lng: 68.7842 },
    { id: "shirin", name: "Shirin shahri", lat: 40.2330, lng: 69.1160 },
    { id: "yangiyer", name: "Yangiyer shahri", lat: 40.2730, lng: 68.8220 },
    { id: "boyovut", name: "Boyovut tumani", lat: 40.3500, lng: 68.9160 },
    { id: "guliston_district", name: "Guliston tumani", lat: 40.4660, lng: 68.8000 },
    { id: "xovos", name: "Xovos tumani", lat: 40.1660, lng: 68.8160 },
    { id: "mirzaobod", name: "Mirzaobod tumani", lat: 40.5000, lng: 68.6660 },
    { id: "oqoltin", name: "Oqoltin tumani", lat: 40.6160, lng: 68.3660 },
    { id: "sardoba", name: "Sardoba tumani", lat: 40.3830, lng: 68.2830 },
    { id: "sayxunobod", name: "Sayxunobod tumani", lat: 40.6500, lng: 68.9000 },
    { id: "sirdaryo", name: "Sirdaryo tumani", lat: 40.8430, lng: 68.6610 },
  ],
  surkhandarya: [
    { id: "termiz", name: "Termiz shahri", lat: 37.2242, lng: 67.2783 },
    { id: "angor", name: "Angor tumani", lat: 37.4000, lng: 67.1500 },
    { id: "bandixon", name: "Bandixon tumani", lat: 37.8160, lng: 67.5830 },
    { id: "boysun", name: "Boysun tumani", lat: 38.2000, lng: 67.2000 },
    { id: "denov", name: "Denov tumani", lat: 38.2660, lng: 67.8980 },
    { id: "jarqorgon", name: "Jarqo'rg'on tumani", lat: 37.5160, lng: 67.6160 },
    { id: "muzrabot", name: "Muzrabot tumani", lat: 37.5660, lng: 66.9830 },
    { id: "oltinsoy", name: "Oltinsoy tumani", lat: 38.2500, lng: 67.7330 },
    { id: "qiziriq", name: "Qiziriq tumani", lat: 37.7660, lng: 67.2660 },
    { id: "qumqorgon", name: "Qumqo'rg'on tumani", lat: 37.8660, lng: 67.6000 },
    { id: "sariosiyo", name: "Sariosiyo tumani", lat: 38.4500, lng: 67.9830 },
    { id: "sherobod", name: "Sherobod tumani", lat: 37.6620, lng: 67.0100 },
    { id: "shorchi", name: "Sho'rchi tumani", lat: 38.0160, lng: 67.7830 },
    { id: "termiz_district", name: "Termiz tumani", lat: 37.3160, lng: 67.3330 },
    { id: "uzun", name: "Uzun tumani", lat: 38.4160, lng: 68.1000 },
  ],
};

/** Flatten for backward compat */
export const DISTRICTS = Object.values(DISTRICTS_BY_REGION).flat();

export function getDistrictsByRegion(regionId) {
  return DISTRICTS_BY_REGION[regionId] || [];
}

export function findDistrict(regionId, districtName) {
  const list = regionId ? getDistrictsByRegion(regionId) : DISTRICTS;
  return (
    list.find((d) => d.name.toLowerCase() === String(districtName || "").toLowerCase()) ||
    null
  );
}

/** Backward-compat */
export function findDistrictByName(name) {
  return findDistrict(null, name);
}

/**
 * Narx modeli (fallback):
 * - base = 7000 so'm (start)
 * - perKm = 1200 so'm
 * - min = 15000 so'm
 */
export function estimateDistrictPrice(distanceKm) {
  const km = Math.max(0, Number(distanceKm) || 0);
  const base = 7000;
  const perKm = 1200;
  const min = 15000;
  return Math.max(min, Math.round(base + km * perKm));
}