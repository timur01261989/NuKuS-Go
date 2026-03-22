import { DRIVER_PRESENCE_LIST_MIN, DRIVER_PRESENCE_ROW } from "./columns/presenceColumns.js";

const MAX_LIST = 2000;
const DEFAULT_LIST = 400;
const MAX_NEARBY = 500;

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} sb — service role
 */
export function createDriverPresenceRepository(sb) {
  if (!sb) throw new Error("driverPresenceRepository: supabase client kerak");

  return {
    /**
     * @param {Record<string, unknown>} payload — driver_id majburiy
     */
    async upsertRow(payload) {
      const { data, error } = await sb
        .from("driver_presence")
        .upsert([payload], { onConflict: "driver_id" })
        .select(DRIVER_PRESENCE_ROW)
        .single();

      if (error) {
        const msg = String(error.message || "").toLowerCase();
        if (msg.includes("column")) {
          const { data: fb, error: err2 } = await sb
            .from("driver_presence")
            .upsert([stripOptionalPresenceColumns(payload)], { onConflict: "driver_id" })
            .select(DRIVER_PRESENCE_LIST_MIN)
            .single();
          if (err2) throw err2;
          return fb;
        }
        throw error;
      }
      return data;
    },

    /**
     * Barcha onlaynlar (faqat zarur) — katta limitdan saqlanish
     */
    async listOnlineSince(sinceIso, { serviceType = "", limit = DEFAULT_LIST } = {}) {
      const cap = Math.min(Math.max(Number(limit) || DEFAULT_LIST, 1), MAX_LIST);
      let q = sb
        .from("driver_presence")
        .select(DRIVER_PRESENCE_ROW)
        .eq("is_online", true)
        .gte("last_seen_at", sinceIso)
        .limit(cap);

      if (serviceType) q = q.eq("active_service_type", serviceType);

      const { data, error } = await q;
      if (error) {
        const msg = String(error.message || "").toLowerCase();
        if (msg.includes("column")) {
          const { data: fb, error: e2 } = await sb
            .from("driver_presence")
            .select(DRIVER_PRESENCE_LIST_MIN)
            .eq("is_online", true)
            .gte("last_seen_at", sinceIso)
            .limit(cap);
          if (e2) throw e2;
          return fb || [];
        }
        throw error;
      }
      return data || [];
    },

    /**
     * PostGIS RPC — indekslangan radius qidiruv
     */
    async nearbyOnline({
      lng,
      lat,
      radiusM = 2500,
      sinceIso,
      serviceType = null,
      limit = 120,
    }) {
      const cap = Math.min(Math.max(Number(limit) || 100, 1), MAX_NEARBY);
      const { data, error } = await sb.rpc("nearby_online_drivers", {
        p_lng: lng,
        p_lat: lat,
        p_radius_m: radiusM,
        p_since: sinceIso,
        p_service_type: serviceType,
        p_limit: cap,
      });
      if (error) throw error;
      return data || [];
    },
  };
}

function stripOptionalPresenceColumns(payload) {
  const base = { ...payload };
  delete base.speed;
  delete base.bearing;
  delete base.accuracy;
  delete base.device_id;
  delete base.platform;
  delete base.app_version;
  return base;
}
