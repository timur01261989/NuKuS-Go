export function haversineKm(a, b) {
  if (!a || !b) return 0;
  const [lat1, lng1] = a;
  const [lat2, lng2] = b;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLng / 2);
  const q =
    s1 * s1 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      s2 * s2;
  const c = 2 * Math.atan2(Math.sqrt(q), Math.sqrt(1 - q));
  return R * c;
}

export function fmtMoney(n, currency = "UZS") {
  const v = Number(n || 0);
  const s = v.toLocaleString("uz-UZ");
  return currency === "USD" ? `$${s}` : `${s} so'm`;
}
