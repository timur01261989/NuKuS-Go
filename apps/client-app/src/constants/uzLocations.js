// Uzbekistan Regions & Districts (client/driver inter-provincial feature)
// NOTE: Keep this as a pure data module (no React).

export const UZ_REGIONS = [
  {
    id: "qrk",
    name: "Qoraqalpog‘iston",
    districts: [
      "Amudaryo","Beruniy","Bo‘zatov","Chimboy","Ellikqal’a","Kegeyli","Mo‘ynoq",
      "Nukus tumani","Nukus shahri","Qanliko‘l","Qo‘ng‘irot","Qorao‘zak",
      "Shumanay","Taxtako‘pir","Taxiatosh","To‘rtko‘l","Xo‘jayli"
    ],
  },
  { id:"and", name:"Andijon", districts:["Andijon shahri","Andijon tumani","Asaka","Baliqchi","Bo‘ston","Buloqboshi","Izboskan","Jalaquduq","Marhamat","Oltinko‘l","Paxtaobod","Qo‘rg‘ontepa","Shahrixon","Ulug‘nor","Xo‘jaobod"] },
  { id:"bux", name:"Buxoro", districts:["Buxoro shahri","Buxoro tumani","G‘ijduvon","Jondor","Kogon shahri","Kogon tumani","Olot","Peshku","Qorako‘l","Qorovulbozor","Romitan","Shofirkon","Vobkent"] },
  { id:"far", name:"Farg‘ona", districts:["Farg‘ona shahri","Farg‘ona tumani","Beshariq","Bog‘dod","Buvayda","Dang‘ara","Furqat","Oltiariq","Qo‘qon shahri","Qo‘shtepa","Quva","Quvasoy shahri","Rishton","So‘x","Toshloq","Uchko‘prik","Yozyovon"] },
  { id:"jiz", name:"Jizzax", districts:["Jizzax shahri","Jizzax tumani","Arnasoy","Baxmal","Do‘stlik","Forish","G‘allaorol","Mirzacho‘l","Paxtakor","Yangiobod","Zafarobod","Zarbdor"] },
  { id:"nam", name:"Namangan", districts:["Namangan shahri","Namangan tumani","Chortoq","Chust","Kosonsoy","Mingbuloq","Norin","Pop","To‘raqo‘rg‘on","Uchqo‘rg‘on","Uychi","Yangiqo‘rg‘on"] },
  { id:"nav", name:"Navoiy", districts:["Navoiy shahri","Karmana","Konimex","Navbahor","Nurota","Qiziltepa","Tomdi","Uchquduq","Zarafshon shahri"] },
  { id:"qas", name:"Qashqadaryo", districts:["Qarshi shahri","Qarshi tumani","Chiroqchi","Dehqonobod","G‘uzor","Kasbi","Kitob","Koson","Mirishkor","Muborak","Nishon","Qamashi","Shahrisabz shahri","Shahrisabz tumani","Yakkabog‘"] },
  { id:"sam", name:"Samarqand", districts:["Samarqand shahri","Samarqand tumani","Bulung‘ur","Ishtixon","Jomboy","Kattaqo‘rg‘on shahri","Kattaqo‘rg‘on tumani","Koshrabot","Narpay","Nurobod","Oqdaryo","Paxtachi","Pastdarg‘om","Payariq","Qo‘shrabot","Tayloq","Urgut"] },
  { id:"sur", name:"Surxondaryo", districts:["Termiz shahri","Termiz tumani","Angor","Bandixon","Boysun","Denov","Jarqo‘rg‘on","Muzrabot","Oltinsoy","Qiziriq","Qumqo‘rg‘on","Sariosiyo","Sherobod","Sho‘rchi","Uzun"] },
  { id:"sir", name:"Sirdaryo", districts:["Guliston shahri","Guliston tumani","Boyovut","Mirzaobod","Oqoltin","Sardoba","Sayxunobod","Sirdaryo","Xovos","Yangiyer shahri","Shirin shahri"] },
  { id:"tosh", name:"Toshkent viloyati", districts:["Bekobod shahri","Bekobod tumani","Bo‘ka","Bo‘stonliq","Chinoz","Ohangaron shahri","Ohangaron tumani","Oqqo‘rg‘on","Parkent","Piskent","Qibray","Quyi Chirchiq","O‘rta Chirchiq","Yuqori Chirchiq","Yangiyo‘l shahri","Yangiyo‘l tumani","Zangiota","Angren shahri","Chirchiq shahri","Olmaliq shahri"] },
  { id:"tsh", name:"Toshkent shahri", districts:["Bektemir","Chilonzor","Yashnobod","Mirobod","Mirzo Ulug‘bek","Olmazor","Sergeli","Shayxontohur","Uchtepa","Yakkasaroy","Yunusobod"] },
  { id:"xor", name:"Xorazm", districts:["Urganch shahri","Urganch tumani","Bog‘ot","Gurlan","Hazorasp","Xiva shahri","Xiva tumani","Qo‘shko‘pir","Shovot","Xonqa","Yangibozor","Tuproqqal’a"] },
];

export function getRegionById(id) {
  if (!id) return null;
  return UZ_REGIONS.find(r => r.id === id) || null;
}
export function getDistrictsByRegionId(id) {
  const r = getRegionById(id);
  return r?.districts || [];
}
export function formatRegionDistrict(regionName, districtName) {
  const r = (regionName || "").trim();
  const d = (districtName || "").trim();
  if (!r) return "";
  if (!d) return r;
  return `${r} • ${d}`;
}
