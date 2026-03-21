const holds = globalThis.__UNIGO_TRIP_HOLDS__ || (globalThis.__UNIGO_TRIP_HOLDS__ = new Map());
const waitlists = globalThis.__UNIGO_TRIP_WAITLISTS__ || (globalThis.__UNIGO_TRIP_WAITLISTS__ = new Map());

function nowMs() {
  return Date.now();
}

function tripKey(tripId) {
  return String(tripId || '').trim();
}

function activeHoldsForTrip(tripId) {
  const key = tripKey(tripId);
  const tripHolds = holds.get(key) || [];
  const alive = tripHolds.filter((row) => row.expiresAt > nowMs() && row.status === 'held');
  if (alive.length !== tripHolds.length) holds.set(key, alive);
  return alive;
}

export function getHeldSeatCount(tripId) {
  return activeHoldsForTrip(tripId).reduce((sum, row) => sum + Number(row.seats || 0), 0);
}

export function getAvailableSeats(trip, bookedSeats = 0) {
  const total = Number(trip?.seats_total ?? trip?.seats ?? 0);
  const held = getHeldSeatCount(trip?.id);
  return Math.max(0, total - Number(bookedSeats || 0) - held);
}

export function createSeatHold({ trip, bookingUserId, seats = 1, ttlMs = 5 * 60 * 1000, bookedSeats = 0 }) {
  const tripId = tripKey(trip?.id);
  if (!tripId) throw new Error('trip.id kerak');
  const cleanSeats = Math.max(1, Number(seats || 1));
  const available = getAvailableSeats(trip, bookedSeats);
  if (available < cleanSeats) {
    return { ok: false, error: 'Not enough seats', availableSeats: available };
  }
  const hold = {
    holdId: `hold_${tripId}_${bookingUserId || 'guest'}_${nowMs()}`,
    tripId,
    bookingUserId: bookingUserId || null,
    seats: cleanSeats,
    status: 'held',
    createdAt: new Date().toISOString(),
    expiresAt: nowMs() + ttlMs,
  };
  const tripHolds = activeHoldsForTrip(tripId);
  tripHolds.push(hold);
  holds.set(tripId, tripHolds);
  return { ok: true, hold, availableSeats: available - cleanSeats };
}

export function confirmSeatHold({ tripId, holdId }) {
  const key = tripKey(tripId);
  const tripHolds = activeHoldsForTrip(key);
  const row = tripHolds.find((item) => item.holdId === holdId);
  if (!row) return { ok: false, error: 'Hold not found' };
  row.status = 'confirmed';
  holds.set(key, tripHolds.filter((item) => item.holdId !== holdId));
  return { ok: true, hold: row };
}

export function releaseSeatHold({ tripId, holdId }) {
  const key = tripKey(tripId);
  const tripHolds = activeHoldsForTrip(key);
  holds.set(key, tripHolds.filter((item) => item.holdId !== holdId));
  return { ok: true };
}

export function pushWaitlist({ tripId, userId, seats = 1, payload = {} }) {
  const key = tripKey(tripId);
  const list = waitlists.get(key) || [];
  const entry = {
    waitlistId: `wait_${key}_${userId || 'guest'}_${nowMs()}`,
    userId: userId || null,
    seats: Math.max(1, Number(seats || 1)),
    payload,
    createdAt: new Date().toISOString(),
  };
  list.push(entry);
  waitlists.set(key, list);
  return { ok: true, entry, queueLength: list.length };
}

export function peekWaitlist(tripId) {
  const key = tripKey(tripId);
  const list = waitlists.get(key) || [];
  return list[0] || null;
}

export function promoteWaitlist({ trip, bookedSeats = 0 }) {
  const key = tripKey(trip?.id);
  const list = waitlists.get(key) || [];
  if (!list.length) return { ok: false, promoted: null };
  const available = getAvailableSeats(trip, bookedSeats);
  const index = list.findIndex((row) => row.seats <= available);
  if (index < 0) return { ok: false, promoted: null };
  const [promoted] = list.splice(index, 1);
  waitlists.set(key, list);
  return { ok: true, promoted, remaining: list.length };
}

export function getTripInventorySnapshot(trip, bookedSeats = 0) {
  const availableSeats = getAvailableSeats(trip, bookedSeats);
  const heldSeats = getHeldSeatCount(trip?.id);
  const waitlist = waitlists.get(tripKey(trip?.id)) || [];
  return {
    tripId: trip?.id || null,
    totalSeats: Number(trip?.seats_total ?? trip?.seats ?? 0),
    bookedSeats: Number(bookedSeats || 0),
    heldSeats,
    availableSeats,
    waitlistCount: waitlist.length,
  };
}
