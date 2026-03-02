// server/_shared/tripState.js
export const ORDER_STATES = Object.freeze({
  CREATED: 'created',
  MATCHING: 'matching',
  ACCEPTED: 'accepted',
  ARRIVED: 'arrived',
  IN_TRIP: 'in_trip',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
});

const ALLOWED = new Map([
  [ORDER_STATES.CREATED, new Set([ORDER_STATES.MATCHING, ORDER_STATES.CANCELLED])],
  [ORDER_STATES.MATCHING, new Set([ORDER_STATES.ACCEPTED, ORDER_STATES.CANCELLED])],
  [ORDER_STATES.ACCEPTED, new Set([ORDER_STATES.ARRIVED, ORDER_STATES.CANCELLED])],
  [ORDER_STATES.ARRIVED, new Set([ORDER_STATES.IN_TRIP, ORDER_STATES.CANCELLED])],
  [ORDER_STATES.IN_TRIP, new Set([ORDER_STATES.COMPLETED, ORDER_STATES.CANCELLED])],
  [ORDER_STATES.COMPLETED, new Set([])],
  [ORDER_STATES.CANCELLED, new Set([])],
]);

export function canTransition(from, to) {
  return !!ALLOWED.get(from)?.has(to);
}