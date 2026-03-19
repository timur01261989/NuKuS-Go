export function buildTripTelemetry({
  tripsPublished = 0,
  bookingsCreated = 0,
  bookingsCompleted = 0,
  waitlistPromotions = 0,
  corridorMatches = 0,
  airportBookings = 0,
}) {
  const publishCount = Math.max(0, Number(tripsPublished || 0));
  const created = Math.max(0, Number(bookingsCreated || 0));
  const completed = Math.max(0, Number(bookingsCompleted || 0));
  return {
    trips_published: publishCount,
    bookings_created: created,
    bookings_completed: completed,
    conversion_rate: publishCount > 0 ? Number((created / publishCount).toFixed(4)) : 0,
    completion_rate: created > 0 ? Number((completed / created).toFixed(4)) : 0,
    waitlist_promotions: Math.max(0, Number(waitlistPromotions || 0)),
    corridor_matches: Math.max(0, Number(corridorMatches || 0)),
    airport_bookings: Math.max(0, Number(airportBookings || 0)),
  };
}
