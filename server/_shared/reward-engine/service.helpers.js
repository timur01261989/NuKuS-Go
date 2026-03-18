function createBaseContext({ config }) {
  return {
    config,
    event: null,
    rewards: [],
    auditTrail: [],
    metrics: {
      events_created: 0,
      events_failed: 0,
      rewards_issued: 0,
      rewards_skipped: 0,
      amount_issued_uzs: 0,
    },
    currentReward: null,
    error: null,
  };
}

function compareUsageAgainstLimit(used, limit) {
  if (limit == null) return false;
  return Number(used || 0) >= Number(limit || 0);
}


export { createBaseContext, compareUsageAgainstLimit };
