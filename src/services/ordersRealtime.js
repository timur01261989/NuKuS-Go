import { supabase, assertSupabase } from '@/services/supabase/supabaseClient';

export function subscribeOrder(orderId, onChange) {
  assertSupabase();
  const sb = supabase;
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

export async function subscribeDriverLocation(orderId, onChange) {
  assertSupabase();
  const sb = supabase;

  // We support multiple schema variants:
  // Variant A (order-scoped): driver_locations(order_id, driver_id, lat, lng, updated_at, ...)
  // Variant B (driver-scoped): driver_locations(driver_id, lat, lng, updated_at, ...)
  //
  // We detect columns and choose the safest subscription strategy.

  const hasColumn = async (col) => {
    try {
      const { error } = await sb.from('driver_locations').select(col).limit(1);
      return !error;
    } catch {
      return false;
    }
  };

  const hasOrderId = await hasColumn('order_id');
  const hasDriverUserId = await hasColumn('driver_id');
  const hasDriverId = await hasColumn('driver_id');

  let driverLocChannel = null;
  let orderChannel = null;

  const subscribeByFilter = (channelName, filter) => {
    if (driverLocChannel) {
      sb.removeChannel(driverLocChannel);
      driverLocChannel = null;
    }
    driverLocChannel = sb
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'driver_locations', filter },
        (payload) => onChange?.(payload)
      )
      .subscribe();
  };

  if (hasOrderId && hasDriverUserId) {
    // Best case: subscribe by order_id directly.
    subscribeByFilter(`driverloc:order:${orderId}`, `order_id=eq.${orderId}`);

    // No need to track orders changes in this variant.
    return () => {
      if (driverLocChannel) sb.removeChannel(driverLocChannel);
    };
  }

  // Fallback: subscribe by assigned driver id from the orders table.
  let currentDriverKey = null;

  const subscribeByDriverKey = (driverKey) => {
    if (!driverKey) return;
    if (currentDriverKey === driverKey && driverLocChannel) return;

    currentDriverKey = driverKey;
    const filter = hasDriverId
      ? `driver_id=eq.${driverKey}`
      : (hasDriverUserId ? `driver_id=eq.${driverKey}` : null);

    if (!filter) return;

    subscribeByFilter(`driverloc:driver:${orderId}:${driverKey}`, filter);
  };

  orderChannel = sb
    .channel(`order_driver:${orderId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
      (payload) => {
        const row = payload?.new || null;
        const driverKey =
          row?.driver_id ||
          row?.driver_id ||
          row?.driverId ||
          null;

        subscribeByDriverKey(driverKey);
        onChange?.({ type: 'order_change', payload });
      }
    )
    .subscribe();

  return () => {
    if (driverLocChannel) sb.removeChannel(driverLocChannel);
    if (orderChannel) sb.removeChannel(orderChannel);
  };
}
