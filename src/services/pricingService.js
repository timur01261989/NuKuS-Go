/**
 * pricingService.js
 * Narx hisoblash — avval server API'dan so'raydi (AI surge bilan),
 * xato bo'lsa local tariffs.json'dan fallback hisoblaydi.
 *
 * Server API (api/pricing.js) Supabase surge_config jadvalidagi
 * admin tomonidan belgilangan qoidalar bilan surge multiplier hisoblaydi:
 *  - Vaqt qoidalari (tun tarifi, ish soati)
 *  - Ob-havo (yomg'ir, qor) — OPENWEATHER_API_KEY bo'lsa
 *  - Talab (haydovchi kam, buyurtma ko'p)
 *  - Admin qo'lda yoqqan surge
 */

const API_BASE = (import.meta?.env?.VITE_API_BASE || "").replace(/\/$/, "");

// ─── Local fallback (server bo'lmasa) ────────────────────────────────────────
async function fetchJson(path) {
  const r = await fetch(path, { cache: "no-cache" });
  if (!r.ok) throw new Error(`Failed to load ${path}`);
  return r.json();
}

function timeNowHHMM() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}

function inRange(t, from, to) {
  if (from <= to) return t >= from && t <= to;
  return t >= from || t <= to;
}

async function estimateLocal({ service_type = "standard", distance_km = 0, duration_min = 0 }) {
  const cfg = await fetchJson("/config/tariffs.json");
  const svc = cfg?.services?.[service_type] || cfg?.services?.standard;
  if (!svc) return { price_uzs: 0, currency: "UZS", multiplier: 1, surge_active: false, surge_reason: null };

  let price =
    Number(svc.base || 0) +
    Number(svc.per_km || 0) * Number(distance_km || 0) +
    Number(svc.per_min || 0) * Number(duration_min || 0);
  let mult = 1;
  const now = timeNowHHMM();

  if (cfg?.surge?.enabled && Array.isArray(cfg?.surge?.rules)) {
    for (const r of cfg.surge.rules) {
      if (r?.from && r?.to && inRange(now, r.from, r.to)) {
        mult = Math.max(mult, Number(r.multiplier || 1));
      }
    }
    mult = Math.min(mult, Number(cfg?.surge?.max_multiplier || mult));
  }
  price = Math.round(price * mult);
  if (price < Number(svc.min_fare || 0)) price = Number(svc.min_fare || 0);

  return {
    price_uzs: price,
    base_price_uzs: Math.round(price / mult),
    currency: cfg.currency || "UZS",
    multiplier: mult,
    surge_active: mult > 1,
    surge_reason: mult > 1 ? "Tun tarifi" : null,
    source: "local",
  };
}

// ─── Server API (admin surge_config bilan) ───────────────────────────────────
async function estimateFromServer({ service_type, distance_km, duration_min, lat, lng }) {
  const params = new URLSearchParams({
    service_type: service_type || "standard",
    distance_km: String(distance_km || 0),
    duration_min: String(duration_min || 0),
  });
  if (lat != null) params.set("lat", String(lat));
  if (lng != null) params.set("lng", String(lng));

  const r = await fetch(`${API_BASE}/api/pricing?${params}`, { signal: AbortSignal.timeout(4000) });
  if (!r.ok) throw new Error(`Pricing API: HTTP ${r.status}`);
  const j = await r.json();
  if (!j.ok) throw new Error(j.error || "Pricing API xatosi");
  return { ...j, source: "server" };
}

/**
 * estimatePrice({ service_type, distance_km, duration_min, lat?, lng? })
 *
 * Avval server API'dan so'raydi (real-time surge).
 * Xato bo'lsa (tarmoq yo'q, server ishlamaydi) — local fallback.
 *
 * @returns {Promise<{price_uzs, multiplier, surge_active, surge_reason, source}>}
 */
export async function estimatePrice({ service_type = "standard", distance_km = 0, duration_min = 0, lat = null, lng = null } = {}) {
  try {
    return await estimateFromServer({ service_type, distance_km, duration_min, lat, lng });
  } catch {
    // Fallback: local tariffs.json
    return await estimateLocal({ service_type, distance_km, duration_min });
  }
}
