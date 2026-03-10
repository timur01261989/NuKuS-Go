export function serializeOrder(row) {
  if (!row) return null;
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
    ...order,
  };
}
