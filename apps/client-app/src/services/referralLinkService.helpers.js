export function getSafeWindow() {
  return typeof window !== "undefined" ? window : null;
}

export function getSafeLocalStorage() {
  const safeWindow = getSafeWindow();
  try {
    return safeWindow?.localStorage || null;
  } catch {
    return null;
  }
}

export function normalizeReferralCode(rawValue) {
  return String(rawValue || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "")
    .slice(0, 32);
}

export function getShareBaseUrl() {
  const fromEnv = String(import.meta?.env?.VITE_APP_SHARE_BASE_URL || "")
    .trim()
    .replace(/\/$/, "");
  if (fromEnv) {
    return fromEnv;
  }

  const safeWindow = getSafeWindow();
  return String(safeWindow?.location?.origin || "").replace(/\/$/, "");
}
