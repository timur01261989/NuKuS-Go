const listeners = new Set();
let watchId = null;
let latest = { lat: null, lng: null, heading: null, speed: null };

function normalizePosition(position) {
  const { latitude, longitude, heading, speed } = position.coords || {};
  const speedKmh = Number.isFinite(speed) ? Math.round(speed * 3.6) : 0;
  return {
    lat: Number.isFinite(latitude) ? latitude : null,
    lng: Number.isFinite(longitude) ? longitude : null,
    heading: Number.isFinite(heading) ? heading : null,
    speed: speedKmh,
  };
}

function publish(next) {
  latest = { ...latest, ...next };
  try {
    window.__driver_lat = latest.lat;
    window.__driver_lng = latest.lng;
    window.__driver_speed = latest.speed;
    window.__driver_heading = latest.heading;
  } catch {}
  listeners.forEach((cb) => {
    try { cb(latest); } catch {}
  });
}

function ensureWatch() {
  if (watchId != null || !navigator.geolocation) return watchId;
  watchId = navigator.geolocation.watchPosition(
    (position) => publish(normalizePosition(position)),
    (error) => console.error('GPS xatosi:', error),
    {
      enableHighAccuracy: true,
      maximumAge: 1000,
      timeout: 12000,
    }
  );
  return watchId;
}

export const startTracking = (callback) => {
  if (typeof callback === 'function') {
    listeners.add(callback);
    if (latest.lat != null || latest.lng != null) {
      try { callback(latest); } catch {}
    }
  }
  ensureWatch();
  return watchId;
};

export const stopTracking = (callback) => {
  if (typeof callback === 'function') listeners.delete(callback);
  if (listeners.size === 0 && watchId != null && navigator.geolocation?.clearWatch) {
    try { navigator.geolocation.clearWatch(watchId); } catch {}
    watchId = null;
  }
};

export const getLatestTrackingPosition = () => latest;
