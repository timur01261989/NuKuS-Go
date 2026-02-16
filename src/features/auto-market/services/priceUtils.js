export function formatPrice(price, currency = "UZS") {
  const n = Number(price || 0);
  const formatted = new Intl.NumberFormat("ru-RU").format(n);
  if (currency === "USD") return `${formatted} $`;
  return `${formatted} so'm`;
}
