export function shouldPauseRealtime(doc = globalThis?.document) {
  try {
    return Boolean(doc?.hidden);
  } catch {
    return false;
  }
}

export function buildRealtimeEventSignature(payload) {
  if (!payload || typeof payload !== "object") return "";
  const table = payload.table || payload?.source || "";
  const eventType = payload.eventType || payload.event || payload.type || "";
  const nextId = payload?.new?.id || payload?.record?.id || payload?.payload?.new?.id || "";
  const updatedAt = payload?.new?.updated_at || payload?.record?.updated_at || payload?.payload?.new?.updated_at || "";
  return [table, eventType, nextId, updatedAt].filter(Boolean).join(":");
}

export function buildRealtimeMeta({
  source = "realtime",
  state = "idle",
  lastEventAt = null,
  lastRefreshAt = null,
  hidden = false,
  paused = false,
  duplicate = false,
} = {}) {
  return {
    source,
    state,
    lastEventAt,
    lastRefreshAt,
    hidden,
    paused,
    duplicate,
  };
}

export function buildHeartbeatMeta({
  lastEventAt = null,
  lastLocationAt = null,
  now = Date.now(),
} = {}) {
  const eventGapMs = lastEventAt ? Math.max(0, now - new Date(lastEventAt).getTime()) : null;
  const locationGapMs = lastLocationAt ? Math.max(0, now - new Date(lastLocationAt).getTime()) : null;
  return {
    eventGapMs,
    locationGapMs,
    isEventStale: eventGapMs != null ? eventGapMs > 60000 : false,
    isLocationStale: locationGapMs != null ? locationGapMs > 60000 : false,
  };
}
