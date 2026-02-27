import api from "@/utils/apiHelper";

/**
 * intercityApi.js
 * - Intercity (viloyatlararo) reyslar uchun API wrapper.
 *
 * Siz backendda quyidagi endpoint/actions'larni qo'yishingiz mumkin:
 *   POST /api/intercity { action: "list_offers", from_city, to_city, date, passengers }
 *   POST /api/intercity { action: "request_booking", offer_id, seats, passengers, date, from_city, to_city }
 *   POST /api/intercity { action: "my_bookings" }
 *   POST /api/intercity { action: "cancel_booking", booking_id }
 *
 * Agar sizda boshqa endpoint bo'lsa, shu faylni moslab o'zgartirasiz.
 */

async function post(payload) {
  const res = await api.post("/api/intercity", payload);
  return res?.data ?? res;
}

const intercityApi = {
  async listOffers(params) {
    const data = await post({ action: "list_offers", ...params });
    // backend turiga qarab moslash
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.offers)) return data.offers;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  },

  async requestBooking({ offer_id, seats, passengers, date, from_city, to_city }) {
    const data = await post({
      action: "request_booking",
      offer_id,
      seats,
      passengers,
      date,
      from_city,
      to_city,
    });
    return data;
  },

  async myBookings() {
    const data = await post({ action: "my_bookings" });
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.bookings)) return data.bookings;
    return [];
  },

  async cancelBooking(booking_id) {
    return await post({ action: "cancel_booking", booking_id });
  },
};

export default intercityApi;
