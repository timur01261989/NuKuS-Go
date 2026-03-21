// ─── Haversine distance ───────────────────────────────────────────────────────
export function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const sin1 = Math.sin(dLat / 2) ** 2;
  const sin2 = Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(sin1 + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * sin2), Math.sqrt(1 - (sin1 + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * sin2)));
  return R * c;
}

// ─── Format price ──────────────────────────────────────────────────────────
export function formatPriceUZS(amount: number): string {
  return `${Math.round(amount).toLocaleString("ru-RU")} so'm`;
}

// ─── Phone normalize ──────────────────────────────────────────────────────
export function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 12);
}

// ─── Debounce ─────────────────────────────────────────────────────────────
export function debounce<T extends (...args: any[]) => any>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: any[]) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); }) as T;
}

// ─── Retry ────────────────────────────────────────────────────────────────
export async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 500): Promise<T> {
  try { return await fn(); } catch (e) {
    if (retries <= 0) throw e;
    await new Promise(r => setTimeout(r, delay));
    return withRetry(fn, retries - 1, delay * 2);
  }
}
