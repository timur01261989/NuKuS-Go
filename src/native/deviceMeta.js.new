// src/native/deviceMeta.js
import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';

export async function getDeviceMeta() {
  try {
    if (!Capacitor.isNativePlatform()) return { platform: 'web', device_id: null, app_version: null };
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