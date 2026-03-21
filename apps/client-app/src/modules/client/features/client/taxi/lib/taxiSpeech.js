import taxiLogger from "../../../../../shared/taxi/utils/taxiLogger";

export function speak(text) {
  try {
    if (!("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ru-RU";
    u.rate = 1;
    u.pitch = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch (error) {
    taxiLogger.warn("client.taxi.speech.failed", { error });
  }
}
