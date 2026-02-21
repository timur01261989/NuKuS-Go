export const startTracking = (callback) => {
  if (!navigator.geolocation) return;

  // Yuqori aniqlikda (GPS + Wi-Fi) kuzatish
  return navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude, heading, speed } = position.coords;
      callback({ lat: latitude, lng: longitude, heading, speed });
    },
    (error) => console.error("GPS xatosi:", error),
    {
      enableHighAccuracy: true, // GPS-ni yoqish
      maximumAge: 1000,         // Keshlangan joylashuvdan foydalanmaslik
      timeout: 5000             // 5 soniya kutish
    }
  );
};