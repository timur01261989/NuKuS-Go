import { postJson } from './payments/paymentHttp.js';

export function listMyDeliveryOrders() {
  return postJson('/api/delivery', { action: 'list_my_orders' });
}

export function listDriverDeliveryOrders() {
  return postJson('/api/delivery', { action: 'list_driver_orders' });
}

export function createDeliveryOrderApi(payload) {
  return postJson('/api/delivery', { action: 'create_order', payload });
}

export function updateDeliveryOrderApi(id, patch) {
  return postJson('/api/delivery', { action: 'update_order', id, patch });
}

export function deleteDeliveryOrderApi(id) {
  return postJson('/api/delivery', { action: 'delete_order', id });
}

export function driverUpdateDeliveryStatusApi({ id, status, patch = {}, history = null, driverName = '' }) {
  return postJson('/api/delivery', {
    action: 'driver_update_status',
    id,
    status,
    patch,
    history,
    driver_name: driverName,
  });
}
