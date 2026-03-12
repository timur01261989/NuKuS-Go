import api from "@/utils/apiHelper";
import { supabase } from "@/lib/supabase";

async function post(path, body) {
  try {
    const res = await api.post(path, body);
    return res?.data ?? res;
  } catch (error) {
    throw error;
  }
}

export const interProvincialApi = {
  async createTrip(payload) {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    const userId = authData?.user?.id || null;
    if (!userId) throw new Error('Login qiling');

    const enriched = {
      ...payload,
      user_id: payload.user_id || userId,
      amenities: payload.amenities || {},
      child_seat_types: payload.child_seat_types || [],
      waiting_policy: payload.waiting_policy || {},
      recurring_rule: payload.recurring_rule || null,
      booking_mode: payload.booking_mode || 'approval',
    };
    try {
      return await post('/api/order', { action: 'interprov_trip_create', ...enriched });
    } catch (e) {
      const { data, error } = await supabase.from('inter_prov_trips').insert([enriched]).select('*').single();
      if (error) throw error;
      return { data };
    }
  },

  async updateTrip(tripId, patch) {
    try {
      return await post('/api/order', { action: 'interprov_trip_update', tripId, patch });
    } catch (e) {
      const { data, error } = await supabase.from('inter_prov_trips').update(patch).eq('id', tripId).select('*').single();
      if (error) throw error;
      return { data };
    }
  },

  async listSeatRequests(tripId) {
    try {
      const r = await post('/api/order', { action: 'interprov_seat_requests', tripId });
      return r?.data || r?.requests || [];
    } catch (e) {
      const { data } = await supabase.from('inter_prov_seat_requests').select('*').eq('trip_id', tripId).order('created_at', { ascending: true });
      return data || [];
    }
  },

  async respondSeatRequest({ requestId, accept }) {
    try {
      return await post('/api/order', { action: 'interprov_seat_request_respond', requestId, accept });
    } catch (e) {
      const { data, error } = await supabase.from('inter_prov_seat_requests').update({ status: accept ? 'accepted' : 'declined' }).eq('id', requestId).select('*').single();
      if (error) throw error;
      return { data };
    }
  },

  async saveRecurringTemplate(template) {
    return post('/api/intercity', { action: 'save_recurring_template', template });
  },

  async listRecurringTemplates() {
    return post('/api/intercity', { action: 'list_recurring_templates' });
  },

  async uploadParcelPhoto(file, tripId) {
    if (!file) return null;
    const path = `parcels/${tripId || 'no_trip'}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('public').upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('public').getPublicUrl(path);
    return data?.publicUrl || null;
  },

  async sendParcelSms(payload) {
    try {
      return await post('/api/sms', { action: 'send', ...payload });
    } catch {
      return { ok: true };
    }
  },
};
