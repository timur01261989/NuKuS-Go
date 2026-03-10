export function toCreateOrderPayload({ pickup, dest, tariff, totalPrice, distanceKm, waypoints, orderFor, otherPhone, wishes, comment, scheduledTime }) {
  return {
    service_type: 'taxi',
    pickup: pickup?.latlng
      ? { lat: pickup.latlng[0], lng: pickup.latlng[1], address: pickup.address || '' }
      : null,
    dropoff: dest?.latlng
      ? { lat: dest.latlng[0], lng: dest.latlng[1], address: dest.address || '' }
      : null,
    fare: totalPrice || 0,
    tariff_id: tariff?.id || 'start',
    payment_method: 'cash',
    distance_km: dest?.latlng ? (distanceKm || 0) : 0,
    duration_min: dest?.latlng ? Math.max(1, Math.round(Number(distanceKm || 0) * 2)) : 0,
    waypoints: Array.isArray(waypoints)
      ? waypoints.map((w) => ({ lat: w.latlng?.[0], lng: w.latlng?.[1], address: w.address || '' })).filter((w) => w.lat != null && w.lng != null)
      : [],
    pickup_entrance: pickup?.entrance || '',
    order_for: orderFor,
    other_phone: orderFor === 'other' ? otherPhone || '' : '',
    wishes: wishes || {},
    comment: comment || '',
    scheduled_time: scheduledTime || null,
    // legacy compatibility fields
    pickup_location: pickup?.address || '',
    dropoff_location: dest?.address || '',
    from_lat: pickup?.latlng?.[0] ?? null,
    from_lng: pickup?.latlng?.[1] ?? null,
    to_lat: dest?.latlng?.[0] ?? null,
    to_lng: dest?.latlng?.[1] ?? null,
  };
}

export function fromOrderResponse(order) {
  if (!order) return null;
  const pickup = order.pickup || (order.from_lat != null || order.from_lng != null ? { lat: Number(order.from_lat), lng: Number(order.from_lng), address: order.pickup_location || '' } : null);
  const dropoff = order.dropoff || (order.to_lat != null || order.to_lng != null ? { lat: Number(order.to_lat), lng: Number(order.to_lng), address: order.dropoff_location || '' } : null);
  return {
    id: String(order.id || order.order_id || order.orderId || ''),
    status: order.status || order.order_status || 'searching',
    pickup,
    dropoff,
    driver: order.driver || order.assigned_driver || order.assignedDriver || null,
    raw: order,
  };
}
