import { assertSupabase } from './supabaseClient.js';

export function subscribeOrder(orderId, onChange) {
  const sb = assertSupabase();
  const channel = sb
    .channel(`order:${orderId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
      (payload) => onChange?.(payload)
    )
    .subscribe();

  return () => sb.removeChannel(channel);
}

export function subscribeDriverLocation(orderId, onChange) {
  const sb = assertSupabase();

  // IMPORTANT:
  // The app has multiple schema variants.
  // In common variants, `driver_locations` does NOT have `order_id`.
  // Instead, we subscribe to the assigned driver_id (from orders table) and then listen to:
  //   driver_locations where driver_id == <driverId>
  // If driver_id changes (reassign), we rewire the subscription.

  let driverLocChannel = null;
  let currentDriverId = null;

  const subscribeByDriverId = (driverId) => {
    if (!driverId) return;
    if (driverLocChannel) {
      sb.removeChannel(driverLocChannel);
      driverLocChannel = null;
    }

    currentDriverId = driverId;
    driverLocChannel = sb
      .channel(`driverloc:${orderId}:${driverId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'driver_locations', filter: `driver_id=eq.${driverId}` },
        (payload) => onChange?.(payload)
      )
      .subscribe();
  };

  // Track order changes to find/re-find driver_id.
  const orderChannel = sb
    .channel(`order_driver:${orderId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
      (payload) => {
        const nextDriverId = payload?.new?.driver_id || null;
        if (nextDriverId && nextDriverId !== currentDriverId) {
          subscribeByDriverId(nextDriverId);
        }
        // Forward order payload too (keeps existing consumers working if they rely on it).
        onChange?.(payload);
      }
    )
    .subscribe();

  // Initial best-effort fetch of driver_id.
  (async () => {
    try {
      const { data, error } = await sb.from('orders').select('driver_id').eq('id', orderId).maybeSingle();
      if (!error && data?.driver_id) subscribeByDriverId(data.driver_id);
    } catch {
      // ignore
    }
  })();

  return () => {
    if (driverLocChannel) sb.removeChannel(driverLocChannel);
    sb.removeChannel(orderChannel);
  };
}
