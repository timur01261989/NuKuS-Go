export default function formatPrice(value) {
  return new Intl.NumberFormat("uz-UZ").format(Number(value || 0));
}
