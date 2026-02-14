/**
 * src/utils/apiHelper.js (MAX variant)
 * ------------------------------------------------------------
 * Features:
 * - Base URL (VITE_API_BASE_URL) + safe joining
 * - JSON, text, blob, multipart support
 * - Auth token / refresh token hooks (pluggable)
 * - Timeout + AbortController + cancel
 * - Retries with exponential backoff + jitter (idempotent by default)
 * - Query-string builder
 * - Request/response normalization + rich error object
 * - Optional in-memory cache (GET) + dedupe inflight requests
 * - Lightweight event hooks (onRequest/onResponse/onError/onAuthFail)
 *
 * Usage:
 *   import api from "@/utils/apiHelper";
 *   const data = await api.get("/api/order", { query: { mine: 1 } });
 *   const res  = await api.post("/api/order", { ...payload });
 *
 * Configure once (optional):
 *   api.configure({
 *     getAccessToken: () => localStorage.getItem("token"),
 *     setAccessToken: (t) => localStorage.setItem("token", t),
 *     getRefreshToken: () => localStorage.getItem("refresh_token"),
 *     refreshAccessToken: async ({ refreshToken }) => {
 *        // return { accessToken, refreshToken? }
 *     },
 *   });
 */

// ------------------------------
// Small utils
// ------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const randomJitter = (base) => {
  // jitter: +-20%
  const delta = base * 0.2;
  return base + (Math.random() * 2 - 1) * delta;
};

const isPlainObject = (v) =>
  v != null && typeof v === "object" && Object.getPrototypeOf(v) === Object.prototype;

const safeTrimSlash = (s) => (s || "").replace(/\/+$/, "");

const joinUrl = (base, path) => {
  const b = safeTrimSlash(base);
  const p = (path || "").toString().replace(/^\/+/, "");
  if (!b) return `/${p}`.replace(/\/+$/, "");
  return `${b}/${p}`;
};

const toQueryString = (query) => {
  if (!query || !isPlainObject(query)) return "";
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) {
      v.forEach((item) => {
        if (item === undefined || item === null) return;
        params.append(k, String(item));
      });
    } else if (typeof v === "object") {
      // nested object -> JSON
      params.set(k, JSON.stringify(v));
    } else {
      params.set(k, String(v));
    }
  }
  const s = params.toString();
  return s ? `?${s}` : "";
};

const pick = (obj, keys) => {
  const out = {};
  for (const k of keys) if (obj && obj[k] !== undefined) out[k] = obj[k];
  return out;
};

const now = () => Date.now();

// ------------------------------
// Rich error type
// ------------------------------
class ApiError extends Error {
  /**
   * @param {string} message
   * @param {object} info
   */
  constructor(message, info = {}) {
    super(message);
    this.name = "ApiError";
    this.status = info.status ?? null;
    this.code = info.code ?? null;
    this.details = info.details ?? null;
    this.url = info.url ?? null;
    this.method = info.method ?? null;
    this.requestId = info.requestId ?? null;
    this.payload = info.payload ?? null;
    this.response = info.response ?? null;
    this.isNetworkError = !!info.isNetworkError;
    this.isTimeout = !!info.isTimeout;
    this.isAbort = !!info.isAbort;
  }
}

// ------------------------------
// Core client defaults
// ------------------------------
const DEFAULTS = {
  baseURL: safeTrimSlash(import.meta?.env?.VITE_API_BASE_URL || ""),
  timeoutMs: 15000,
  // Retries are only for idempotent methods by default
  retry: {
    enabled: true,
    maxAttempts: 2, // total tries = 1 + retries
    baseDelayMs: 400,
    maxDelayMs: 2500,
    retryOnStatuses: [408, 425, 429, 500, 502, 503, 504],
    retryOnNetworkError: true,
    retryMethods: ["GET", "HEAD", "OPTIONS", "PUT", "DELETE"], // POST not retried by default
  },
  cache: {
    enabled: true,
    defaultTtlMs: 8000,
    maxEntries: 200,
  },
  headers: {
    Accept: "application/json",
  },

  // auth hooks (pluggable)
  getAccessToken: () => localStorage.getItem("token"),
  setAccessToken: (t) => localStorage.setItem("token", t),
  getRefreshToken: () => localStorage.getItem("refresh_token"),
  setRefreshToken: (t) => localStorage.setItem("refresh_token", t),

  /**
   * Optional refresh token function.
   * Should return: { accessToken: string, refreshToken?: string }
   */
  refreshAccessToken: null,

  // event hooks
  hooks: {
    onRequest: null,   // ({ url, method, headers, body, meta }) => void
    onResponse: null,  // ({ url, method, status, data, meta }) => void
    onError: null,     // (ApiError) => void
    onAuthFail: null,  // (ApiError) => void
  },
};

// Inflight dedupe: key -> Promise
const inflight = new Map();

// Simple cache: key -> { expiresAt, value }
const cacheStore = new Map();

const pruneCache = (cfg) => {
  const { maxEntries } = cfg.cache;
  // remove expired
  const t = now();
  for (const [k, v] of cacheStore.entries()) {
    if (v.expiresAt <= t) cacheStore.delete(k);
  }
  // size cap: remove oldest-ish (Map preserves insertion order)
  while (cacheStore.size > maxEntries) {
    const firstKey = cacheStore.keys().next().value;
    cacheStore.delete(firstKey);
  }
};

const makeCacheKey = (method, url, headers) => {
  // Only GET cached by default. Include auth header to prevent cross-user mix.
  const auth = headers?.Authorization || "";
  return `${method}:${url}:auth=${auth}`;
};

const parseResponse = async (res, responseType) => {
  if (responseType === "blob") return await res.blob();
  if (responseType === "text") return await res.text();

  // default json; tolerate empty
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    // some endpoints may return plain text
    return text;
  }
};

const shouldRetry = (cfg, method, status, err) => {
  const r = cfg.retry;
  if (!r.enabled) return false;

  const m = method.toUpperCase();
  const isMethodOk = r.retryMethods.includes(m);
  if (err) {
    if (err.isAbort || err.isTimeout) return false;
    return r.retryOnNetworkError && isMethodOk;
  }
  return isMethodOk && r.retryOnStatuses.includes(status);
};

const computeDelay = (cfg, attempt) => {
  const r = cfg.retry;
  const expo = r.baseDelayMs * Math.pow(2, attempt - 1);
  const capped = Math.min(expo, r.maxDelayMs);
  return Math.max(0, Math.floor(randomJitter(capped)));
};

const withTimeout = (signal, timeoutMs) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  // bridge external signal
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  return {
    signal: controller.signal,
    cancel: () => controller.abort(),
    cleanup: () => clearTimeout(timer),
  };
};

async function doRefresh(cfg) {
  if (typeof cfg.refreshAccessToken !== "function") return null;
  const refreshToken = cfg.getRefreshToken?.();
  if (!refreshToken) return null;

  const res = await cfg.refreshAccessToken({ refreshToken });
  if (!res || !res.accessToken) return null;

  cfg.setAccessToken?.(res.accessToken);
  if (res.refreshToken) cfg.setRefreshToken?.(res.refreshToken);
  return res.accessToken;
}

function normalizeError(message, info) {
  return new ApiError(message, info);
}

function buildHeaders(cfg, extraHeaders, includeAuth = true) {
  const headers = {
    ...cfg.headers,
    ...(extraHeaders || {}),
  };
  if (includeAuth) {
    const token = cfg.getAccessToken?.();
    if (token && !headers.Authorization) headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

// ------------------------------
// Public API
// ------------------------------
const api = {
  _cfg: (() => {
    // avoid structuredClone dependency
    try {
      return structuredClone(DEFAULTS);
    } catch {
      return JSON.parse(JSON.stringify(DEFAULTS));
    }
  })(),

  configure(partial) {
    // deep-ish merge for a few known objects
    const cfg = this._cfg;

    for (const [k, v] of Object.entries(partial || {})) {
      if (k === "retry" && isPlainObject(v)) cfg.retry = { ...cfg.retry, ...v };
      else if (k === "cache" && isPlainObject(v)) cfg.cache = { ...cfg.cache, ...v };
      else if (k === "headers" && isPlainObject(v)) cfg.headers = { ...cfg.headers, ...v };
      else if (k === "hooks" && isPlainObject(v)) cfg.hooks = { ...cfg.hooks, ...v };
      else cfg[k] = v;
    }
  },

  clearCache() {
    cacheStore.clear();
  },

  /**
   * Core request
   * @param {string} path
   * @param {object} options
   * @returns {Promise<any>}
   */
  async request(path, options = {}) {
    const cfg = this._cfg;

    const method = (options.method || "GET").toUpperCase();
    const base = options.baseURL ?? cfg.baseURL;
    const qs = toQueryString(options.query);
    const url = joinUrl(base, `${path}${qs}`);

    const requestId =
      options.requestId ||
      `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const meta = { requestId, ...pick(options, ["tag"]) };

    const includeAuth = options.includeAuth !== false;
    let headers = buildHeaders(cfg, options.headers, includeAuth);

    // Body handling
    let body = undefined;
    const bodyType = options.bodyType || "json"; // json | form | raw
    if (options.body !== undefined && options.body !== null) {
      if (bodyType === "form") {
        // multipart/form-data
        const form = new FormData();
        const b = options.body;
        if (b instanceof FormData) {
          body = b;
        } else if (isPlainObject(b)) {
          for (const [k, v] of Object.entries(b)) {
            if (v === undefined || v === null) continue;
            if (Array.isArray(v)) v.forEach((item) => form.append(k, item));
            else form.append(k, v);
          }
          body = form;
        } else {
          throw new Error("bodyType=form expects object or FormData");
        }
        // IMPORTANT: do not set Content-Type for FormData (browser will set boundary)
        delete headers["Content-Type"];
      } else if (bodyType === "raw") {
        body = options.body;
      } else {
        // json
        headers["Content-Type"] = headers["Content-Type"] || "application/json";
        body = JSON.stringify(options.body);
      }
    }

    // Cache/dedupe keys (GET only by default)
    const allowCache = cfg.cache.enabled && (options.cache ?? true) && method === "GET";
    const cacheTtlMs = options.cacheTtlMs ?? cfg.cache.defaultTtlMs;
    const cacheKey = allowCache ? makeCacheKey(method, url, headers) : null;

    // Return cached result if fresh
    if (allowCache && cacheKey) {
      pruneCache(cfg);
      const hit = cacheStore.get(cacheKey);
      if (hit && hit.expiresAt > now()) return hit.value;
    }

    // Inflight dedupe for GET
    const dedupe = options.dedupe ?? (method === "GET");
    if (dedupe && cacheKey && inflight.has(cacheKey)) {
      return inflight.get(cacheKey);
    }

    // Timeout + AbortController
    const timeoutMs = options.timeoutMs ?? cfg.timeoutMs;
    const t = withTimeout(options.signal, timeoutMs);

    const responseType = options.responseType || "json"; // json|text|blob
    const fetchOpts = {
      method,
      headers,
      body,
      signal: t.signal,
      credentials: options.credentials ?? "same-origin",
      keepalive: !!options.keepalive,
    };

    cfg.hooks?.onRequest?.({ url, method, headers, body: options.body, meta });

    const makeAttempt = async (attemptNo) => {
      try {
        const res = await fetch(url, fetchOpts);

        // Auth fail (try refresh once)
        if (res.status === 401 && includeAuth && options.allowRefresh !== false) {
          const newToken = await doRefresh(cfg);
          if (newToken) {
            headers = buildHeaders(cfg, options.headers, includeAuth);
            fetchOpts.headers = headers;
            const res2 = await fetch(url, fetchOpts);
            const data2 = await parseResponse(res2, responseType);
            if (!res2.ok) {
              const err = normalizeError(
                (data2 && (data2.error || data2.message)) || `HTTP ${res2.status}`,
                {
                  status: res2.status,
                  url,
                  method,
                  requestId,
                  payload: options.body ?? null,
                  response: data2,
                }
              );
              cfg.hooks?.onAuthFail?.(err);
              throw err;
            }
            cfg.hooks?.onResponse?.({ url, method, status: res2.status, data: data2, meta });
            if (allowCache && cacheKey) {
              cacheStore.set(cacheKey, { value: data2, expiresAt: now() + cacheTtlMs });
              pruneCache(cfg);
            }
            return data2;
          }
        }

        const data = await parseResponse(res, responseType);

        if (!res.ok) {
          const err = normalizeError(
            (data && (data.error || data.message)) || `HTTP ${res.status}`,
            {
              status: res.status,
              url,
              method,
              requestId,
              payload: options.body ?? null,
              response: data,
            }
          );

          if (
            shouldRetry(cfg, method, res.status, null) &&
            attemptNo < cfg.retry.maxAttempts + 1
          ) {
            const delay = computeDelay(cfg, attemptNo);
            await sleep(delay);
            return await makeAttempt(attemptNo + 1);
          }

          cfg.hooks?.onError?.(err);
          throw err;
        }

        cfg.hooks?.onResponse?.({ url, method, status: res.status, data, meta });

        if (allowCache && cacheKey) {
          cacheStore.set(cacheKey, { value: data, expiresAt: now() + cacheTtlMs });
          pruneCache(cfg);
        }

        return data;
      } catch (e) {
        // Abort / timeout
        if (e?.name === "AbortError") {
          const err = normalizeError("So‘rov bekor qilindi yoki timeout bo‘ldi", {
            url,
            method,
            requestId,
            isAbort: true,
            isTimeout: true,
            isNetworkError: false,
          });
          cfg.hooks?.onError?.(err);
          throw err;
        }

        // If already ApiError -> no wrapping
        if (e instanceof ApiError) throw e;

        const err = normalizeError(e?.message || "Network xatolik", {
          url,
          method,
          requestId,
          isNetworkError: true,
          payload: options.body ?? null,
        });

        if (
          shouldRetry(cfg, method, null, err) &&
          attemptNo < cfg.retry.maxAttempts + 1
        ) {
          const delay = computeDelay(cfg, attemptNo);
          await sleep(delay);
          return await makeAttempt(attemptNo + 1);
        }

        cfg.hooks?.onError?.(err);
        throw err;
      } finally {
        t.cleanup();
      }
    };

    const promise = makeAttempt(1);
    if (dedupe && cacheKey) inflight.set(cacheKey, promise);

    try {
      return await promise;
    } finally {
      if (dedupe && cacheKey) inflight.delete(cacheKey);
    }
  },

  // Convenience methods
  get(path, opts) {
    return this.request(path, { ...(opts || {}), method: "GET" });
  },
  post(path, body, opts) {
    return this.request(path, {
      ...(opts || {}),
      method: "POST",
      body,
      bodyType: opts?.bodyType || "json",
    });
  },
  put(path, body, opts) {
    return this.request(path, {
      ...(opts || {}),
      method: "PUT",
      body,
      bodyType: opts?.bodyType || "json",
    });
  },
  patch(path, body, opts) {
    return this.request(path, {
      ...(opts || {}),
      method: "PATCH",
      body,
      bodyType: opts?.bodyType || "json",
    });
  },
  delete(path, opts) {
    return this.request(path, { ...(opts || {}), method: "DELETE" });
  },

  /**
   * Create a cancellable request
   * @returns {{ promise: Promise<any>, cancel: Function, requestId: string }}
   */
  cancellable(path, opts = {}) {
    const controller = new AbortController();
    const requestId =
      opts.requestId || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const promise = this.request(path, { ...opts, signal: controller.signal, requestId });
    return { promise, cancel: () => controller.abort(), requestId };
  },
};

export { ApiError };
export default api;
