/**
 * PRODUCTION-GRADE: Price & Currency Utilities
 * High-performance formatting for UniGo Super App.
 */

const UZ_FORMATTER = new Intl.NumberFormat("uz-UZ", {
  style: "decimal",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * Raqamlarni uz-UZ formatiga o'tkazadi.
 */
export function formatNumber(n) {
  try {
    const value = Number(n || 0);
    return UZ_FORMATTER.format(value);
  } catch (e) {
    console.error("FormatNumber Error:", e);
    return String(n ?? "");
  }
}

/**
 * [CRITICAL FIX]: formatCurrency exporti qo'shildi.
 */
export const formatCurrency = (n) => formatNumber(n);

/**
 * Narxni valyuta belgisi bilan formatlash.
 */
export function formatPrice(price, currency = "UZS") {
  const p = Number(price || 0);
  if (!p) return "Kelishiladi";
  
  const formatted = formatNumber(p);
  // SINTAKSIS XATO TUZATILDI: Backticklar qo'shildi
  if (currency === "USD") return `${formatted} $`;
  return `${formatted} so'm`;
}

/**
 * Statik valyuta kursi.
 */
export const FX = {
  USD_UZS: 12500,
};

/**
 * Valyuta konvertatsiyasi.
 */
export function convert(price, from, to) {
  const p = Number(price || 0);
  if (!p || from === to) return p;
  
  if (from === "USD" && to === "UZS") return Math.round(p * FX.USD_UZS);
  if (from === "UZS" && to === "USD") return Math.round(p / FX.USD_UZS);
  return p;
}