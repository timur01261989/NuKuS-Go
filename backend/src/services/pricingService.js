async function fetchJson(path) {
  const r = await fetch(path, { cache: 'no-cache' });
  if (!r.ok) throw new Error(`Failed to load ${path}`);
  return r.json();
}

function timeNowHHMM() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2,'0');
  const mm = String(d.getMinutes()).padStart(2,'0');
  return `${hh}:${mm}`;
}
function inRange(t, from, to) {
  if (from <= to) return t >= from && t <= to;
  return t >= from || t <= to;
}

export async function estimatePrice({ service_type='standard', distance_km=0, duration_min=0 }) {
  const cfg = await fetchJson('/config/tariffs.json');
  const svc = cfg?.services?.[service_type] || cfg?.services?.standard;
  if (!svc) return { price_uzs: 0, currency: 'UZS', multiplier: 1 };

  let price = Number(svc.base||0) + Number(svc.per_km||0)*Number(distance_km||0) + Number(svc.per_min||0)*Number(duration_min||0);
  let mult = 1;
  const now = timeNowHHMM();

  if (cfg?.surge?.enabled && Array.isArray(cfg?.surge?.rules)) {
    for (const r of cfg.surge.rules) {
      if (r?.from && r?.to && inRange(now, r.from, r.to)) mult = Math.max(mult, Number(r.multiplier||1));
    }
    mult = Math.min(mult, Number(cfg?.surge?.max_multiplier||mult));
  }
  price = Math.round(price * mult);
  if (price < Number(svc.min_fare||0)) price = Number(svc.min_fare||0);

  return { price_uzs: price, currency: cfg.currency || 'UZS', multiplier: mult };
}
