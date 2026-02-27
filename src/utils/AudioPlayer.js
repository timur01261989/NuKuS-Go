/**
 * src/utils/AudioPlayer.js
 * Lightweight audio/voice helper.
 *
 * This file exists because several UI modules import:
 *  - { playAliceVoice } from '@/utils/AudioPlayer'
 *
 * We keep it dependency-free and safe in browsers that block autoplay.
 */

const VOICE_MAP = {
  RouteStarted: "Yo'l boshlandi",
  Arrived: "Manzilga yetib keldik",
  Searching: "Haydovchi qidirilmoqda",
  DriverFound: "Haydovchi topildi",
  OrderAccepted: "Buyurtma qabul qilindi",
  OrderCancelled: "Buyurtma bekor qilindi",
};

export function playAliceVoice(keyOrText) {
  try {
    const text = VOICE_MAP[keyOrText] || String(keyOrText || "");
    if (!text) return;

    // Prefer SpeechSynthesis if available
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const u = new SpeechSynthesisUtterance(text);
      // Uzbek/ru voices vary; don't force a language to avoid silent failures.
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
      return;
    }

    // Fallback: no-op (avoid crashing)
  } catch (_) {
    // no-op
  }
}
