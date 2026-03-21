const audioCache = {};

export const playSound = (soundName) => {
  // soundName: 'success', 'arrived', 'new_order'
  if (!audioCache[soundName]) {
    audioCache[soundName] = new Audio(`/assets/sounds/${soundName}.mp3`);
  }

  audioCache[soundName].currentTime = 0; // Har safar boshidan qo'yish
  audioCache[soundName].play().catch(e => console.log("Ovozni qo'yib bo'lmadi:", e));
};

// Ishlatilishi:
// if (status === 'completed') playSound('success');