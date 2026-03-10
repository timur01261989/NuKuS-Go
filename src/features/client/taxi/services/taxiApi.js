import api from '@/utils/apiHelper';

/** Thin wrapper around apiHelper for taxi. Unified contract only. */
export const taxiApi = {
  createOrder: (payload) => api.post('/api/order', payload),
  getOrder: (payload) => api.post('/api/order', { action: 'get', ...payload }),
  getActiveOrder: () => api.post('/api/order', { action: 'active' }),
  cancelOrder: (payload) => api.post('/api/order_status', { status: 'cancelled_by_client', ...payload }),
  updateStatus: (payload) => api.post('/api/order_status', payload),
  dispatch: (payload) => api.post('/api/dispatch', payload),
};

export default taxiApi;
