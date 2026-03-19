// src/native/deviceMeta.js
// Safe web stub — Capacitor packages loaded dynamically only on native platform.

export async function getDeviceMeta() {
  try {
    const isNative = typeof window !== 'undefined' &&
      typeof window.Capacitor !== 'undefined' &&
      window.Capacitor.isNativePlatform?.() === true;

    if (!isNative) {
      return { platform: 'web', device_id: null, app_version: null };
    }

    const [{ Device }, { Capacitor }] = await Promise.all([
      import('@capacitor/device').catch(() => ({ Device: null })),
      import('@capacitor/core').catch(() => ({ Capacitor: null })),
    ]);

    if (!Device) return { platform: 'web', device_id: null, app_version: null };

    const id = await Device.getId();
    const info = await Device.getInfo();

    return {
      platform: info.platform || 'android',
      device_id: id.identifier || null,
      app_version: info.appVersion || null,
    };
  } catch {
    return { platform: 'unknown', device_id: null, app_version: null };
  }
}
