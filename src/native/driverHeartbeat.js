// src/native/driverHeartbeat.js
let timer = null;

async function postJson(url, body, token) {
  const headers = { 'content-type': 'application/json' };
  if (token) headers.authorization = `Bearer ${token}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errMsg = data?.error || `heartbeat_failed HTTP ${res.status}`;
      throw new Error(errMsg);
    }
    return data;
  } catch (error) {
    console.warn('[driverHeartbeat] postJson failed', error?.message || error);
    throw error;
  }
}

export function startHeartbeat({
  driverId,
  baseUrl = '',
  intervalMs = 8000,
  getPosition,
  getServiceType,
  getDeviceMeta,
  getAuthToken,
}) {
  stopHeartbeat();
  if (!driverId && typeof getAuthToken !== 'function') throw new Error('driverId or auth token required');
  if (typeof getPosition !== 'function') throw new Error('getPosition required');

  let consecutiveErrors = 0;
  let currentInterval = Math.max(5000, intervalMs);

  const tick = async () => {
    let pos;
    try {
      pos = await getPosition();
      if (!pos?.lat || !pos?.lng) {
        throw new Error('invalid_position');
      }
    } catch (err) {
      console.warn('[driverHeartbeat] getPosition error', err?.message || err);
      return;
    }

    try {
      const service_type = (await (getServiceType?.() ?? (typeof window !== 'undefined' ? localStorage.getItem('driver_active_service') : 'taxi'))) || 'taxi';
      const device = (await (getDeviceMeta?.() ?? null));
      const token = await (getAuthToken?.() ?? null);

      await postJson(`${baseUrl}/api/presence/heartbeat`, {
        lat: pos.lat,
        lng: pos.lng,
        speed: pos.speed,
        heading: pos.heading,
        state: 'online',
        is_online: true,
        active_service_type: service_type,
        device_id: device?.device_id,
        app_version: device?.app_version,
        platform: device?.platform,
      }, token);

      consecutiveErrors = 0;
      currentInterval = Math.max(5000, intervalMs);
    } catch (error) {
      consecutiveErrors += 1;
      console.warn('[driverHeartbeat] heartbeat tick failed (try ' + consecutiveErrors + ')', error?.message || error);
      const maxBackoff = 60000;
      currentInterval = Math.min(maxBackoff, currentInterval * 1.5);
      if (consecutiveErrors >= 8) {
        console.error('[driverHeartbeat] too many consecutive errors, pausing heartbeat');
        stopHeartbeat();
        return;
      }

      stopHeartbeat();
      timer = setInterval(tick, currentInterval);
    }
  };

  tick();
  timer = setInterval(tick, currentInterval);
}

export function stopHeartbeat() {
  if (timer) clearInterval(timer);
  timer = null;
}
