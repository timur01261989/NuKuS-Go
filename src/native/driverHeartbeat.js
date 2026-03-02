// src/native/driverHeartbeat.js
// Driver heartbeat loop (foreground-safe). For true background mode, add a foreground service plugin later.
//
// Usage:
//   import { startHeartbeat, stopHeartbeat } from './native/driverHeartbeat';
//   startHeartbeat({ driverId, baseUrl, getPosition, getServiceType });
//   stopHeartbeat();
//
let timer = null;

async function postJson(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || 'heartbeat_failed');
  return data;
}

export function startHeartbeat({
  driverId,
  baseUrl = '',
  intervalMs = 8000,
  getPosition,
  getServiceType,
  getDeviceMeta,
}) {
  stopHeartbeat();
  if (!driverId) throw new Error('driverId required');
  if (typeof getPosition !== 'function') throw new Error('getPosition required');

  const tick = async () => {
    try {
      const pos = await getPosition(); // { lat, lng }
      const service_type = (await (getServiceType?.() ?? 'taxi')) || 'taxi';
      const device = (await (getDeviceMeta?.() ?? null));

      await postJson(`${baseUrl}/api/presence/heartbeat`, {
        driver_id: driverId,
        lat: pos?.lat,
        lng: pos?.lng,
        state: 'online',
        active_service_type: service_type,
        device_id: device?.device_id,
        app_version: device?.app_version,
        platform: device?.platform,
      });
    } catch (e) {
      // ignore transient failures; next tick will retry
      // IMPORTANT: do not spam logs in production
    }
  };

  // fire immediately
  tick();
  timer = setInterval(tick, Math.max(5000, intervalMs));
}

export function stopHeartbeat() {
  if (timer) clearInterval(timer);
  timer = null;
}