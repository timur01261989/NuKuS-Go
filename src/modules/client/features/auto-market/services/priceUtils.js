export function formatNumber(n) {
  try {
    return new Intl.NumberFormat("uz-UZ").format(Number(n || 0));
  } catch {
    return String(n ?? "");
  }
}

export function formatPrice(price, currency = "UZS") {
  const p = Number(price || 0);
  if (!p) return "Kelishiladi";
  if (currency === "USD") return `${formatNumber(p)} $`;
  return `${formatNumber(p)} so'm`;
}

// Oddiy kurs (demo). Keyin backenddan olib kelasiz.
export const FX = {
  USD_UZS: 12500,
};

export function convert(price, from, to) {
  const p = Number(price || 0);
  if (!p || from === to) return p;
  if (from === "USD" && to === "UZS") return Math.round(p * FX.USD_UZS);
  if (from === "UZS" && to === "USD") return Math.round(p / FX.USD_UZS);
  return p;
}
