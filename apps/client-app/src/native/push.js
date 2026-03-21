// src/native/push.js
// Capacitor Push Notifications (FCM) — safe for Vercel web builds.
// Static Capacitor imports are replaced with dynamic imports so Rollup
// does NOT try to bundle @capacitor/* which is absent from package.json.

export async function initPush() {
  try {
    // window.Capacitor is injected by Capacitor native runtime only
    const isNative = typeof window !== 'undefined' &&
      typeof window.Capacitor !== 'undefined' &&
      window.Capacitor.isNativePlatform?.() === true;

    if (!isNative) return null;

    // Dynamic import — only executed on native, never bundled for web
    const { PushNotifications } = await import('@capacitor/push-notifications')
      .catch(() => ({ PushNotifications: null }));

    if (!PushNotifications) return null;

    const perm = await PushNotifications.requestPermissions();
    if (perm.receive !== 'granted') return null;

    await PushNotifications.register();

    return new Promise((resolve) => {
      let resolved = false;

      PushNotifications.addListener('registration', (token) => {
        resolved = true;
        resolve(token?.value || null);
      });

      PushNotifications.addListener('registrationError', () => {
        if (!resolved) resolve(null);
      });

      // Fallback after 8 s
      setTimeout(() => { if (!resolved) resolve(null); }, 8000);
    });
  } catch {
    return null;
  }
}
