export const TRANSITIONS = Object.freeze({
  draft: ['searching', 'cancelled', 'cancelled_by_client'],
  pending: ['searching', 'cancelled', 'cancelled_by_client'],
  created: ['searching', 'cancelled', 'cancelled_by_client'],
  searching: ['offered', 'cancelled', 'cancelled_by_client', 'expired'],
  offered: ['accepted', 'cancelled', 'cancelled_by_client', 'expired'],
  accepted: ['arrived', 'in_progress', 'in_trip', 'cancelled_by_driver', 'cancelled_by_client', 'completed'],
  arrived: ['in_progress', 'in_trip', 'cancelled_by_driver', 'cancelled_by_client', 'completed'],
  in_progress: ['completed', 'cancelled_by_driver'],
  in_trip: ['completed', 'cancelled_by_driver'],
});

export function canTransition(from, to) {
  const current = String(from || '').toLowerCase();
  const next = String(to || '').toLowerCase();
  return current === next || (TRANSITIONS[current] || []).includes(next);
}

export function assertTransition(from, to) {
  if (!canTransition(from, to)) {
    throw new Error(`Status transition ruxsat etilmagan: ${from} -> ${to}`);
  }
}
