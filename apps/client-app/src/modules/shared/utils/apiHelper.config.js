export function getDefaultApiConfig() {
  return {
    baseUrl:
      (typeof import.meta !== "undefined" && import.meta?.env?.VITE_API_BASE_URL) ||
      (typeof import.meta !== "undefined" && import.meta?.env?.VITE_API_BASE) ||
      "",
    timeoutMs: 20000,
    retries: 0,
    retryDelayMs: 300,
    retryJitterMs: 150,
    dedupe: true,
    dedupeTtlMs: 0,
    cacheTtlMs: 0,
    getAccessToken: null,
    setAccessToken: null,
    getRefreshToken: null,
    setRefreshToken: null,
    refreshAccessToken: null,
    authHeader: "Authorization",
    authScheme: "Bearer",
    withCredentials: false,
    headers: {},
    onRequest: null,
    onResponse: null,
    onError: null,
    onAuthFail: null,
  };
}
