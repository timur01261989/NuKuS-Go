export function calculateCancelPenalty({ actorRole = 'client', status = 'searching', alreadyAssigned = false }) {
  if (actorRole === 'driver') {
    if (['accepted', 'arrived', 'in_progress'].includes(status)) return { penalty_uzs: 15000, reason: 'driver_cancel_after_accept' };
    return { penalty_uzs: 5000, reason: 'driver_cancel' };
  }
  if (actorRole === 'client') {
    if (alreadyAssigned || ['accepted', 'arrived', 'in_progress'].includes(status)) return { penalty_uzs: 8000, reason: 'client_cancel_after_assignment' };
    return { penalty_uzs: 0, reason: 'free_cancel' };
  }
  return { penalty_uzs: 0, reason: 'none' };
}
