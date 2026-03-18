/**
 * PRODUCTION-GRADE: Price & Currency Utilities
 * High-performance memoization of Intl.NumberFormat to prevent memory bloat in high-load lists.
 */

const UZ_FORMATTER = new Intl.NumberFormat("uz-UZ", {
  style: "decimal",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * Basic number formatting for uz-UZ locale
 */
export function formatNumber(n) {
  try {
    const value = Number(n || 0);
    return UZ_FORMATTER.format(value);
  } catch (e) {
    console.error("FormatNumber Error:", e);
    return String(n ?? "0");
  }
}

/**
 * Canonical currency formatter required by marketplace modules.
 * Strictly exported to fix [vite:load-fallback] ENOENT/Export errors.
 */
export function formatCurrency(amount) {
  return formatNumber(amount);
}

/**
 * Formats price with currency unit
 */
export function formatPrice(price, currency = "UZS") {
  const p = Number(price || 0);
  if (!p) return "Kelishiladi";
  
  const formatted = formatNumber(p);
  if (currency === "USD") return ${formatted} $;
  return ${formatted} so'm;
}

/**
 * Static Exchange Rates (Mock for production-grade failover)
 * In real production, this should be fetched from a global state/cache.
 */
export const FX = {
  USD_UZS: 12500,
};

/**
 * Currency conversion logic with precision handling
 */
export function convert(price, from, to) {
  const p = Number(price || 0);
  if (!p || from === to) return p;
  
  if (from === "USD" && to === "UZS") {
    return Math.round(p * FX.USD_UZS);
  }
  if (from === "UZS" && to === "USD") {
    return Math.round(p / FX.USD_UZS);
  }
  return p;
}