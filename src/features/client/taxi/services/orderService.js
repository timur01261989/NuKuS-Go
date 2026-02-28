// src/features/client/taxi/services/orderService.js
/**
 * Bu servis ClientTaxiPage ichidagi buyurtma yaratish/bekor qilish fetch/supabase logikasini ajratish uchun.
 * Hozircha minimal wrapper: hook ichidan kerakli callbacklarni bu yerga ko'chirib boriladi.
 */
export async function handleOrderCreateService(fn) {
  return fn();
}

export async function handleCancelService(fn) {
  return fn();
}
