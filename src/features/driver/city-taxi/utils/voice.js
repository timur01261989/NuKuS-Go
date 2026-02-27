/**
 * voice.js
 * "Alisa" uslubida ovozli yordamchi (Web Speech API).
 * Android webview / ayrim brauzerlarda o‘chirilgan bo‘lishi mumkin — shunda jim qoladi.
 */
export function speakAlisa(text) {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;

    const u = new SpeechSynthesisUtterance(String(text || ""));
    // rus/uz aralash ishlashi uchun yaqin til:
    u.lang = "ru-RU";

    // ayol ovoz tanlashga urinish
    const voices = synth.getVoices?.() || [];
    const female = voices.find(v => /female|woman|alena|alisa/i.test(v.name)) || voices.find(v => /ru/i.test(v.lang));
    if (female) u.voice = female;

    u.rate = 1.02;
    u.pitch = 1.05;
    synth.cancel();
    synth.speak(u);
  } catch {
    // ignore
  }
}
