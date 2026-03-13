export function startTracking(onChange) {
  if (!navigator.geolocation) return null;

  const watchId = navigator.geolocation.watchPosition(
    (pos) => {
      const coords = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      };
      onChange?.(coords);
    },
    (err) => {
      console.error("Geolocation error:", err);
    },
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
  );

  return watchId;
}
