import { loadConfig } from '../shared/config/configService.js';
import { defaultVoiceConfig } from '../shared/config/defaults_osm.js';

let ttsVoice = null;

function pickVoice(lang) {
  const voices = window.speechSynthesis?.getVoices?.() || [];
  if (!voices.length) return null;
  return voices.find(v => (v.lang || '').toLowerCase() === lang.toLowerCase())
      || voices.find(v => (v.lang || '').toLowerCase().startsWith(lang.split('-')[0].toLowerCase()))
      || voices[0];
}

export async function speak(text) {
  const cfg = await loadConfig('voice', defaultVoiceConfig);
  if (!cfg?.enabled) return;

  const mode = cfg.mode || 'tts';
  if (mode === 'mp3') {
    // If you add mp3 pack later, map it via public/config/voice.json
    return;
  }

  if (!('speechSynthesis' in window)) return;

  const u = new SpeechSynthesisUtterance(text);
  u.lang = cfg.language || 'uz-UZ';
  u.rate = cfg.rate ?? 1.0;
  u.pitch = cfg.pitch ?? 1.0;
  u.volume = cfg.volume ?? 1.0;

  // Try to select voice
  if (!ttsVoice) ttsVoice = pickVoice(u.lang);
  if (ttsVoice) u.voice = ttsVoice;

  try {
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {}
}

export async function speakPhrase(key) {
  const cfg = await loadConfig('voice', defaultVoiceConfig);
  const txt = cfg?.phrases?.[key];
  if (txt) return speak(txt);
}
