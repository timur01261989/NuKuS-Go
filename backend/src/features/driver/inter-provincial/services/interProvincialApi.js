let api = null;
try {
  // eslint-disable-next-line import/no-unresolved
  api = require("@/utils/apiHelper").default;
} catch (e) {
  api = null;
}

let supabase = null;
try {
  // eslint-disable-next-line import/no-unresolved
  supabase = require("@/lib/supabase").supabase;
} catch (e) {
  supabase = null;
}

async function post(path, body) {
  if (api?.post) return api.post(path, body);
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "Server error");
  return data;
}

export const interProvincialApi = {
  // Trip create/update
  async createTrip(payload) {
    // preferred: backend
    try {
      return await post("/api/order", { action: "interprov_trip_create", ...payload });
    } catch (e) {
      // fallback: supabase direct (agar siz ruxsat bergan bo'lsangiz)
      if (supabase) {
        const { data, error } = await supabase.from("inter_prov_trips").insert([payload]).select("*").single();
        if (error) throw error;
        return { data };
      }
      // demo
      return { data: { id: `trip_${Date.now()}`, ...payload } };
    }
  },

  async updateTrip(tripId, patch) {
    try {
      return await post("/api/order", { action: "interprov_trip_update", tripId, patch });
    } catch (e) {
      if (supabase && tripId) {
        const { data, error } = await supabase.from("inter_prov_trips").update(patch).eq("id", tripId).select("*").single();
        if (error) throw error;
        return { data };
      }
      return { data: { id: tripId, ...patch } };
    }
  },

  // Seat requests
  async listSeatRequests(tripId) {
    try {
      const r = await post("/api/order", { action: "interprov_seat_requests", tripId });
      return r?.data || r?.requests || [];
    } catch (e) {
      if (supabase && tripId) {
        const { data } = await supabase.from("inter_prov_seat_requests").select("*").eq("trip_id", tripId).order("created_at", { ascending: true });
        return data || [];
      }
      return [];
    }
  },

  async respondSeatRequest({ requestId, accept }) {
    try {
      return await post("/api/order", { action: "interprov_seat_request_respond", requestId, accept });
    } catch (e) {
      if (supabase && requestId) {
        const { data, error } = await supabase
          .from("inter_prov_seat_requests")
          .update({ status: accept ? "accepted" : "declined" })
          .eq("id", requestId)
          .select("*")
          .single();
        if (error) throw error;
        return { data };
      }
      return { ok: true };
    }
  },

  // Parcel photo upload (optional: Supabase Storage)
  async uploadParcelPhoto(file, tripId) {
    if (!file) return null;
    // try apiHelper
    if (api?.upload) {
      const r = await api.upload("/api/upload", file, { tripId, folder: "parcels" });
      return r?.url || null;
    }
    // try supabase storage
    if (supabase) {
      const path = `parcels/${tripId || "no_trip"}/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from("public").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("public").getPublicUrl(path);
      return data?.publicUrl || null;
    }
    // fallback: base64 in memory (not recommended for production)
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
  },

  async sendParcelSms(payload) {
    // payload: { phone, text, imageUrl, carPlate }
    try {
      return await post("/api/sms", { action: "send", ...payload });
    } catch (e) {
      return { ok: true };
    }
  },
};
