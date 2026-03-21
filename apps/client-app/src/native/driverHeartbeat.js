// src/native/driverHeartbeat.js
let timer = null;

async function postJson(url, body, token) {
  const headers = { 'content-type': 'application/json' };
  if (token) headers.authorization = `Bearer ${token}`;
  const res = await fetch(url, {
    method: 'POST',
    headers,
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
  getAuthToken,
}) {
  stopHeartbeat();
  if (!driverId && typeof getAuthToken !== 'function') throw new Error('driverId or auth token required');
  if (typeof getPosition !== 'function') throw new Error('getPosition required');

  const tick = async () => {
    try {
      const pos = await getPosition();
      const service_type = (await (getServiceType?.() ?? (typeof window !== 'undefined' ? localStorage.getItem('driver_active_service') : 'taxi'))) || 'taxi';
      const device = (await (getDeviceMeta?.() ?? null));
      const token = await (getAuthToken?.() ?? null);

      await postJson(`${baseUrl}/api/presence/heartbeat`, {
                lat: pos?.lat,
        lng: pos?.lng,
        speed: pos?.speed,
        heading: pos?.heading,
        state: 'online',
        is_online: true,
        active_service_type: service_type,
        device_id: device?.device_id,
        app_version: device?.app_version,
        platform: device?.platform,
      }, token);
    } catch {
      // ignore transient failures
    }
  };

  tick();
  timer = setInterval(tick, Math.max(5000, intervalMs));
}

export function stopHeartbeat() {
  if (timer) clearInterval(timer);
  timer = null;
}
