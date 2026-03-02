// src/native/push.js
// Minimal Capacitor Push Notifications wiring (FCM on Android)
//
// Usage:
//   import { initPush } from './native/push';
//   const token = await initPush();
//   send token to server: /api/push/register
//
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

export async function initPush() {
  if (!Capacitor.isNativePlatform()) return null;

  // Request permissions
  const perm = await PushNotifications.requestPermissions();
  if (perm.receive !== 'granted') return null;

  await PushNotifications.register();

  return await new Promise((resolve) => {
    let resolved = false;

    PushNotifications.addListener('registration', (token) => {
      resolved = true;
      resolve(token?.value || null);
    });

    PushNotifications.addListener('registrationError', () => {
      if (!resolved) resolve(null);
    });

    // Fallback resolve after 8s
    setTimeout(() => { if (!resolved) resolve(null); }, 8000);
  });
}