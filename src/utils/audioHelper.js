/**
 * src/utils/audioHelper.js
 * Simple sound effect helper used by map/order UIs.
 */

export function playSound(url, { volume = 1.0 } = {}) {
  try {
    if (typeof window === "undefined") return;
    if (!url) return;
    const a = new Audio(url);
    a.volume = Math.max(0, Math.min(1, volume));
    // Autoplay may be blocked; ignore errors
    a.play().catch(() => {});
  } catch (_) {
    // no-op
  }
}
