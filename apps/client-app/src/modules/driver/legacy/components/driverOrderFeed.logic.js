export function loadInitialDriverService() {
  try {
    return localStorage.getItem("driver_active_service") || null;
  } catch {
    return null;
  }
}

export function persistDriverService(key) {
  try {
    if (key) localStorage.setItem("driver_active_service", key);
    else localStorage.removeItem("driver_active_service");
  } catch {
    // ignore
  }
}

export function buildDriverOrderFeedStats() {
  return {
    todayEarnings: 145000,
    rating: 4.95,
    activity: 98,
    ordersCount: 6,
  };
}
