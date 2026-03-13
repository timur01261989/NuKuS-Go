// src/utils/audioPlayer.js

// Ovozni ijro etish uchun universal funksiya
export const playAliceVoice = (folderName) => {
  try {
    // Build/server paytida Audio bo'lmaydi
    if (typeof window === "undefined" || typeof Audio === "undefined") {
      console.log("playAliceVoice (server/build):", folderName);
      return;
    }

    // Alice paketidagi ixtiyoriy papkadan 0.mp3 ni chaqiramiz
    const audioPath = `/assets/audio/ru_alice/${folderName}/0.mp3`;
    const audio = new Audio(audioPath);

    audio.play().catch((err) => {
      console.error(`Ovoz topilmadi yoki ijro etilmadi: ${folderName}`, err);
    });
  } catch (e) {
    console.error("playAliceVoice error:", e);
  }
};

// Masofani hisoblash (Radar uchun)
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Yer radiusi (metrda)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Masofa metrda
};

// MP3 fayl bo'lmasa, brauzer generatoridan foydalanish
export const playEmergencyBeep = () => {
  try {
    if (typeof window === "undefined") return;

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const context = new AudioCtx();
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sine"; // Yoki 'square'
    oscillator.frequency.setValueAtTime(880, context.currentTime);

    gain.gain.setValueAtTime(0.5, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 1);

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start();
    oscillator.stop(context.currentTime + 1);
  } catch (e) {
    console.error("playEmergencyBeep error:", e);
  }
};
