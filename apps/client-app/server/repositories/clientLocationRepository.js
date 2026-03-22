import { CLIENT_LAST_LOCATION_ROW } from "./columns/presenceColumns.js";

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} sb — service role (RLS chetlab o‘tadi)
 */
export function createClientLocationRepository(sb) {
  if (!sb) throw new Error("clientLocationRepository: supabase client kerak");

  return {
    /**
     * Mijozning oxirgi nuqtasi (trigger location ni to‘ldiradi)
     */
    async upsertLastLocation({ userId, lat, lng, accuracyM = null }) {
      const row = {
        user_id: userId,
        lat: Number(lat),
        lng: Number(lng),
        accuracy_m: accuracyM == null ? null : Number(accuracyM),
      };

      const { data, error } = await sb
        .from("client_last_location")
        .upsert([row], { onConflict: "user_id" })
        .select(CLIENT_LAST_LOCATION_ROW)
        .single();

      if (error) throw error;
      return data;
    },

    async getByUserId(userId) {
      const { data, error } = await sb
        .from("client_last_location")
        .select(CLIENT_LAST_LOCATION_ROW)
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  };
}
