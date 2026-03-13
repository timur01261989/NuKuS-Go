export const CITIES = [
  "Nukus","Toshkent","Samarqand","Buxoro","Andijon","Urganch","Qarshi","Farg'ona","Namangan"
];

export const BRANDS = [
  { id: 1, name: "Chevrolet", logo: "GM" },
  { id: 2, name: "KIA", logo: "KIA" },
  { id: 3, name: "Hyundai", logo: "H" },
  { id: 4, name: "Toyota", logo: "T" },
  { id: 5, name: "Mercedes", logo: "MB" },
  { id: 6, name: "BMW", logo: "BMW" },
];

export const MODELS_BY_BRAND = {
  Chevrolet: ["Cobalt", "Gentra", "Nexia 3", "Spark", "Damas", "Lacetti", "Malibu"],
  KIA: ["K5", "K3", "Sportage", "Sorento", "Rio"],
  Hyundai: ["Elantra", "Sonata", "Tucson", "Santa Fe"],
  Toyota: ["Camry", "Corolla", "RAV4", "Land Cruiser"],
  Mercedes: ["E-Class", "C-Class", "S-Class", "GLC"],
  BMW: ["3 Series", "5 Series", "X5", "X3"],
};

export const FUELS = ["Benzin", "Gaz-Metan", "Gaz-Propan", "Dizel", "Gibrid", "Elektro"];
export const TRANSMISSIONS = ["Avtomat", "Mexanika"];
export const COLORS = ["Oq","Qora","Kulrang","Ko'k","Qizil","Yashil","Sariq","Bej"];
export const BODY_TYPES = ["Sedan","Hatchback","SUV","Coupe","Pickup","Minivan","Universal"];
export const DRIVE_TYPES = ["Oldi (FWD)","Orqa (RWD)","4x4 (AWD)"];

// ─── Zapchast bo'limi ────────────────────────────────────────────────────────
export const ZAPCHAST_CATEGORIES = [
  { id: "dvigatel",     label: "Dvigatel",        emoji: "⚙️" },
  { id: "transmissiya", label: "Transmissiya",     emoji: "🔧" },
  { id: "podveska",     label: "Podveska",         emoji: "🔩" },
  { id: "kuzov",        label: "Kuzov",            emoji: "🚘" },
  { id: "elektrika",    label: "Elektrika",        emoji: "⚡" },
  { id: "rezina",       label: "Rezina/Shina",     emoji: "🔘" },
  { id: "disk",         label: "Disk/G'ildirak",   emoji: "💿" },
  { id: "moy",          label: "Moy/Suyuqlik",     emoji: "🛢️" },
  { id: "filter",       label: "Filtr",            emoji: "🔲" },
  { id: "other",        label: "Boshqa",           emoji: "📦" },
];

export const ZAPCHAST_CONDITIONS = [
  { value: "new",     label: "Yangi" },
  { value: "used",    label: "Ishlatilgan" },
  { value: "damaged", label: "Shikastlangan" },
];

// ─── Xizmat turlari (Rasxod Daftar) ──────────────────────────────────────────
export const SERVICE_TYPES = [
  { id: "oil_change",  label: "Moy almashtirish",   emoji: "🛢️", defaultKm: 10000 },
  { id: "tire",        label: "Rezina almashtirish", emoji: "🔘", defaultKm: 50000 },
  { id: "insurance",   label: "Sug'urta",            emoji: "📋", defaultKm: null  },
  { id: "tex",         label: "Texosmotr",           emoji: "✅", defaultKm: null  },
  { id: "repair",      label: "Ta'mirlash",          emoji: "🔧", defaultKm: null  },
  { id: "wash",        label: "Yuvish",              emoji: "🚿", defaultKm: 1000  },
  { id: "other",       label: "Boshqa",              emoji: "📝", defaultKm: null  },
];

// ─── Barter uchun modellar ro'yxati ────────────────────────────────────────────
export const ALL_MODELS_FLAT = Object.entries(
  typeof MODELS_BY_BRAND !== "undefined"
    ? ((() => {
        const out = {};
        const brands = ["Chevrolet","KIA","Hyundai","Toyota","Mercedes","BMW"];
        const models = {
          Chevrolet:["Cobalt","Gentra","Nexia 3","Spark","Damas","Lacetti","Malibu","Onix","Tracker","Equinox"],
          KIA:["K5","K3","Sportage","Sorento","Rio","Stinger"],
          Hyundai:["Elantra","Sonata","Tucson","Santa Fe","Creta"],
          Toyota:["Camry","Corolla","RAV4","Land Cruiser","Hilux"],
          Mercedes:["E-Class","C-Class","S-Class","GLC","GLE"],
          BMW:["3 Series","5 Series","X5","X3","X7"],
        };
        brands.forEach(b => { out[b] = models[b]; });
        return out;
      })())
    : {}
).flatMap(([brand, models]) => models.map(m => ({ brand, model: m, label: `${brand} ${m}` })));
