export function serializeOrder(row) {
  if (!row) return null;
  const routeMeta = row.route_meta && typeof row.route_meta === 'object' ? row.route_meta : {};
  const order = {
    ...row,
    order_id: row.id,
    order_status: row.status,
    pickup: row.pickup ?? null,
    dropoff: row.dropoff ?? null,
    pickup_location: row.pickup?.address ?? null,
    dropoff_location: row.dropoff?.address ?? null,
    from_lat: row.pickup?.lat ?? null,
    from_lng: row.pickup?.lng ?? null,
    to_lat: row.dropoff?.lat ?? null,
    to_lng: row.dropoff?.lng ?? null,
    price: row.price_uzs ?? 0,
    priceUzs: row.price_uzs ?? 0,
    distance_km: routeMeta.distance_km ?? 0,
    duration_min: routeMeta.duration_min ?? 0,
    tariff_id: routeMeta.tariff_id ?? null,
    waypoints: Array.isArray(routeMeta.waypoints) ? routeMeta.waypoints : [],
    wishes: routeMeta.wishes && typeof routeMeta.wishes === 'object' ? routeMeta.wishes : {},
    pickup_entrance: routeMeta.pickup_entrance ?? null,
    scheduled_time: routeMeta.scheduled_time ?? null,
    order_for: routeMeta.order_for ?? null,
    other_phone: routeMeta.other_phone ?? null,
  };
  return order;
}

export function serializeOrderResponse(row) {
  const order = serializeOrder(row);
  return {
    ok: true,
    id: order?.id ?? null,
    orderId: order?.id ?? null,
    order,
    data: order,
  };
}
