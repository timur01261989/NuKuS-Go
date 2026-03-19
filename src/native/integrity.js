// src/native/integrity.js
// Play Integrity API — safe web stub (no hard Capacitor import).

export async function getIntegrityToken() {
  try {
    const isNative = typeof window !== 'undefined' &&
      typeof window.Capacitor !== 'undefined' &&
      window.Capacitor.isNativePlatform?.() === true;

    if (!isNative) return null;

    // TODO: implement native Capacitor plugin once @capacitor/core is added as dep
    return null;
  } catch {
    return null;
  }
}
