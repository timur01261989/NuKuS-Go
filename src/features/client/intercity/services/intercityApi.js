import api from '@/utils/apiHelper';

async function post(payload) {
  const res = await api.post('/api/intercity', payload);
  return res?.data ?? res;
}

const intercityApi = {
  async listOffers(params) {
    const data = await post({ action: 'list_offers', ...params });
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.offers)) return data.offers;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  },

  async requestBooking({ offer_id, seats, passengers, date, from_city, to_city, from_point, to_point, notes }) {
    return post({
      action: 'request_booking',
      offer_id,
      seats,
      passengers,
      date,
      from_city,
      to_city,
      from_point,
      to_point,
      notes,
    });
  },

  async myBookings() {
    const data = await post({ action: 'my_bookings' });
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.bookings)) return data.bookings;
    return [];
  },

  async cancelBooking(booking_id) {
    return post({ action: 'cancel_booking', booking_id });
  },

  async saveRecurringTemplate(template) {
    return post({ action: 'save_recurring_template', template });
  },

  async listRecurringTemplates() {
    return post({ action: 'list_recurring_templates' });
  },
};

export default intercityApi;
