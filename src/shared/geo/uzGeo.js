// Source of truth (initial seed):
// - Districts of Uzbekistan (Karakalpakstan + Tashkent City districts are filled)
//   You can extend other regions later or load them from Supabase table.
//
// NOTE: Keep keys stable (value) because they are stored in DB.

export const UZ_REGIONS = [
  {
    value: "qoraqalpogiston",
    label: "Qoraqalpog‘iston",
    districts: [
      "Amudaryo",
      "Beruniy",
      "Bo‘zatov",
      "Chimboy",
      "Ellikqal’a",
      "Kegeyli",
      "Mo‘ynoq",
      "Nukus tumani",
      "Qanliko‘l",
      "Qo‘ng‘irot",
      "Qorao‘zak",
      "Shumanay",
      "Taxtako‘pir",
      "To‘rtko‘l",
      "Xo‘jayli",
      "Taxiatosh",
      // Nukus shahri is a separate city; keep in UI separately if needed
    ],
  },
  {
    value: "toshkent_shahri",
    label: "Toshkent shahri",
    districts: [
      "Bektemir",
      "Chilonzor",
      "Yashnobod",
      "Mirobod",
      "Mirzo Ulug‘bek",
      "Sergeli",
      "Shayxontohur",
      "Olmazor",
      "Uchtepa",
      "Yakkasaroy",
      "Yunusobod",
      "Yangihayot",
    ],
  },
  { value: "andijon", label: "Andijon", districts: [] },
  { value: "buxoro", label: "Buxoro", districts: [] },
  { value: "fargona", label: "Farg‘ona", districts: [] },
  { value: "jizzax", label: "Jizzax", districts: [] },
  { value: "qashqadaryo", label: "Qashqadaryo", districts: [] },
  { value: "xorazm", label: "Xorazm", districts: [] },
  { value: "namangan", label: "Namangan", districts: [] },
  { value: "navoiy", label: "Navoiy", districts: [] },
  { value: "samarqand", label: "Samarqand", districts: [] },
  { value: "surxondaryo", label: "Surxondaryo", districts: [] },
  { value: "sirdaryo", label: "Sirdaryo", districts: [] },
  { value: "toshkent_viloyati", label: "Toshkent viloyati", districts: [] },
];

export function getDistrictOptions(regionValue) {
  const r = UZ_REGIONS.find((x) => x.value === regionValue);
  const ds = r?.districts || [];
  // include empty selection option at top
  return [{ value: "", label: "—" }, ...ds.map((d) => ({ value: d, label: d }))];
}
