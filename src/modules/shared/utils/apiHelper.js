import { supabase } from "@/services/supabase/supabaseClient";
import { sleep, randomJitter, isPlainObject, joinUrl, toQueryString, buildKey, pickHeadersObj, inflight, cache, getCached, setCached } from "./apiHelper.core.js";
import { getDefaultApiConfig } from "./apiHelper.config.js";

/**
 * src/utils/apiHelper.js (MAX FIXED)
 * ------------------------------------------------------------
 * A robust fetch wrapper for Vite/React apps.
 *
 * ✅ Base URL support (VITE_API_BASE_URL or absolute/relative)
 * ✅ JSON/text/blob/arrayBuffer + multipart/form-data
 * ✅ Query builder
 * ✅ Timeout + AbortController + cancellation
 * ✅ Retry (idempotent by default) with exponential backoff + jitter
 * ✅ Inflight de-duplication (same request key shares one promise)
 * ✅ Optional GET cache (memory) with TTL
 * ✅ Auth hooks (getAccessToken/refreshAccessToken/etc.)
 * ✅ Hooks: onRequest/onResponse/onError/onAuthFail
 *
 * Usage:
 *   import api from "@/modules/shared/utils/apiHelper";
 *   const ads = await api.get("/api/order", { query:{ action:"list_inter_prov" } });
 *   const res = await api.post("/api/order", { action:"create", ...payload });
 *
 * Configure (optional):
 *   api.configure({
 *     baseUrl: import.meta.env.VITE_API_BASE_URL,
 *     getAccessToken: () => localStorage.getItem("token"),
 *     setAccessToken: (t) => localStorage.setItem("token", t),
 *     getRefreshToken: () => localStorage.getItem("refresh_token"),
 *     setRefreshToken: (t) => localStorage.setItem("refresh_token", t),
 *     refreshAccessToken: async ({ refreshToken }) => ({ accessToken, refreshToken }),
 *   })
 */

// ------------------------------
// Errors
// ------------------------------
export class ApiError extends Error {
  constructor(message, info = {}) {
    super(message);
    this.name = "ApiError";
    this.status = info.status ?? null;
    this.url = info.url ?? null;
    this.method = info.method ?? null;
    this.code = info.code ?? null; // optional backend error code
    this.data = info.data ?? null; // parsed response body (if any)
    this.headers = info.headers ?? null;
    this.isNetworkError = !!info.isNetworkError;
    this.isTimeout = !!info.isTimeout;
    this.isAbort = !!info.isAbort;
    this.cause = info.cause;
  }
}

// ------------------------------
// Shared core helpers
// ------------------------------

// ------------------------------
// API core
// ------------------------------
const api = {
  // Defaults (override via configure)
  _cfg: getDefaultApiConfig(),

  configure(partial = {}) {
    this._cfg = {
      ...this._cfg,
      ...partial,
      retry: { ...this._cfg.retry, ...(partial.retry || {}) },
      cache: { ...this._cfg.cache, ...(partial.cache || {}) },
    };
    return this;
  },

  clearCache() {
    cache.clear();
  },

  // Low-level request
  async request(path, opts = {}) {
    const method = (opts.method || "GET").toUpperCase();
    const baseUrl = opts.baseUrl ?? this._cfg.baseUrl;
    const url = joinUrl(baseUrl, path) + toQueryString(opts.query);

    const bodyType = opts.bodyType || (method === "GET" ? "none" : "json"); // json | form | text | none
    const responseType = opts.responseType || "json"; // json | text | blob | arrayBuffer | raw
    const timeoutMs = Number.isFinite(opts.timeoutMs) ? opts.timeoutMs : this._cfg.timeoutMs;

    // Compose headers
    const headers = new Headers(opts.headers || {});
    if (!headers.has("Accept")) headers.set("Accept", "application/json, text/plain, */*");

    // Auth
    let token = typeof this._cfg.getAccessToken === "function" ? await this._cfg.getAccessToken() : null;
    if (!token) {
      try {
        const { data } = await supabase.auth.getSession();
        token = data?.session?.access_token || null;
      } catch {}
    }
    if (!token && typeof window !== "undefined") {
      try {
        token = window.localStorage?.getItem("token") || null;
      } catch {}
    }
    if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);

    let body = undefined;
    if (method !== "GET" && method !== "HEAD" && bodyType !== "none") {
      if (bodyType === "json") {
        if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
        body = opts.body !== undefined ? JSON.stringify(opts.body) : undefined;
      } else if (bodyType === "text") {
        if (!headers.has("Content-Type")) headers.set("Content-Type", "text/plain; charset=utf-8");
        body = opts.body !== undefined ? String(opts.body) : undefined;
      } else if (bodyType === "form") {
        // Let browser set content-type boundary
        body = opts.body; // should be FormData
      } else {
        body = opts.body;
      }
    }

    // Key for cache/dedupe (exclude AbortController by default; user can pass requestId to force)
    const key = opts.requestId || buildKey({ method, url, query: opts.query, body: opts.body, bodyType });

    const retryConfig = {
      enabled: this._cfg.retry?.enabled ?? (this._cfg.retries > 0),
      max: this._cfg.retry?.max ?? this._cfg.retries ?? 0,
      methods: this._cfg.retry?.methods ?? ["GET"],
      statuses: this._cfg.retry?.statuses ?? [429, 500, 502, 503, 504],
      baseDelayMs: this._cfg.retry?.baseDelayMs ?? this._cfg.retryDelayMs ?? 300,
    };

    const cacheConfig = {
      enabled: this._cfg.cache?.enabled ?? false,
      ttlMs: this._cfg.cache?.ttlMs ?? this._cfg.cacheTtlMs ?? 0,
    };

    // GET cache
    const canCache = cacheConfig.enabled && opts.cache !== false && method === "GET";
    if (canCache) {
      const hit = getCached(key);
      if (hit != null) return hit;
    }

    // Dedupe inflight
    if (opts.dedupe !== false && inflight.has(key)) {
      return inflight.get(key);
    }

    const exec = async () => {
      // Abort + timeout
      const controller = new AbortController();
      const externalSignal = opts.signal;
      const onAbort = () => controller.abort();
      if (externalSignal) {
        if (externalSignal.aborted) controller.abort();
        else externalSignal.addEventListener("abort", onAbort, { once: true });
      }

      const timeoutId =
        timeoutMs > 0
          ? setTimeout(() => {
              try {
                controller.abort();
              } catch {}
            }, timeoutMs)
          : null;

      const reqInit = {
        method,
        headers,
        body,
        signal: controller.signal,
        credentials: opts.credentials || "same-origin",
      };

      if (typeof this._cfg.onRequest === "function") {
        try {
          await this._cfg.onRequest({ url, ...reqInit, key });
        } catch {}
      }

      const doFetchOnce = async () => {
        const res = await fetch(url, reqInit);
        const resHeaders = pickHeadersObj(res.headers);

        let parsed = null;
        let rawText = null;

        // Parse (only once)
        const ct = (res.headers.get("content-type") || "").toLowerCase();

        try {
          if (responseType === "raw") {
            parsed = res;
          } else if (responseType === "text") {
            rawText = await res.text();
            parsed = rawText;
          } else if (responseType === "blob") {
            parsed = await res.blob();
          } else if (responseType === "arrayBuffer") {
            parsed = await res.arrayBuffer();
          } else {
            // json (default)
            if (ct.includes("application/json") || ct.includes("+json")) {
              parsed = await res.json();
            } else {
              rawText = await res.text();
              // try json anyway (some backends mislabel)
              try {
                parsed = rawText ? JSON.parse(rawText) : null;
              } catch {
                parsed = rawText;
              }
            }
          }
        } catch (e) {
          // parsing errors should not hide HTTP errors; keep parsed null/text
          parsed = rawText ?? null;
        }

        if (!res.ok) {
          let msg =
            (parsed && (parsed.message || parsed.error || parsed.detail)) ||
            `HTTP ${res.status} ${res.statusText}`;
          if (msg && typeof msg !== "string") {
            try { msg = JSON.stringify(msg); } catch { msg = String(msg); }
          }
          throw new ApiError(msg, {
            status: res.status,
            url,
            method,
            data: parsed,
            headers: resHeaders,
          });
        }

        if (typeof this._cfg.onResponse === "function") {
          try {
            await this._cfg.onResponse({ url, method, status: res.status, data: parsed, headers: resHeaders, key });
          } catch {}
        }

        return parsed;
      };

      const shouldRetry = (err) => {
        if (!retryConfig.enabled) return false;
        if (err?.isAbort || err?.name === "AbortError") return false;

        const allowedMethods = retryConfig.methods || ["GET"];
        const isMethodOk = allowedMethods.includes(method);
        if (!isMethodOk) return false;

        // Retry on network errors
        if (err instanceof ApiError && err.isNetworkError) return true;

        // Retry on selected HTTP statuses
        const st = err instanceof ApiError ? err.status : null;
        if (typeof st === "number" && (retryConfig.statuses || []).includes(st)) return true;

        return false;
      };

      const withRetry = async () => {
        let attempt = 0;
        let lastErr = null;
        const max = Math.max(0, retryConfig.max || 0);

        while (attempt <= max) {
          try {
            return await doFetchOnce();
          } catch (err) {
            lastErr = err;

            // Auth refresh flow (optional) for 401
            if (
              err instanceof ApiError &&
              err.status === 401 &&
              typeof this._cfg.refreshAccessToken === "function" &&
              typeof this._cfg.getRefreshToken === "function"
            ) {
              try {
                const refreshToken = this._cfg.getRefreshToken();
                if (!refreshToken) throw new Error("No refresh token");

                const refreshed = await this._cfg.refreshAccessToken({ refreshToken });
                if (refreshed?.accessToken && typeof this._cfg.setAccessToken === "function") {
                  this._cfg.setAccessToken(refreshed.accessToken);
                }
                if (refreshed?.refreshToken && typeof this._cfg.setRefreshToken === "function") {
                  this._cfg.setRefreshToken(refreshed.refreshToken);
                }

                // retry immediately once after refresh
                if (refreshed?.accessToken) {
                  headers.set("Authorization", `Bearer ${refreshed.accessToken}`);
                  return await doFetchOnce();
                }
              } catch (e) {
                if (typeof this._cfg.onAuthFail === "function") {
                  try {
                    await this._cfg.onAuthFail({ url, method, error: e });
                  } catch {}
                }
                // fall through
              }
            }

            if (!shouldRetry(err) || attempt === max) throw err;

            const delay = randomJitter(this._cfg.retry.baseDelayMs * Math.pow(2, attempt));
            await sleep(delay);
            attempt += 1;
          }
        }
        throw lastErr;
      };

      try {
        const data = await withRetry();

        if (canCache) {
          const ttl = Number.isFinite(opts.cacheTtlMs) ? opts.cacheTtlMs : this._cfg.cache.ttlMs;
          setCached(key, data, ttl);
        }
        return data;
      } catch (err) {
        // Normalize fetch errors
        let norm = err;
        if (!(err instanceof ApiError)) {
          const isAbort = err?.name === "AbortError";
          norm = new ApiError(isAbort ? "Request cancelled" : "Network error", {
            url,
            method,
            isNetworkError: !isAbort,
            isAbort,
            isTimeout: isAbort && timeoutMs > 0, // best-effort (abort is used for timeout)
            cause: err,
          });
        }

        if (typeof this._cfg.onError === "function") {
          try {
            await this._cfg.onError(norm);
          } catch {}
        }
        throw norm;
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
        if (externalSignal) {
          try {
            externalSignal.removeEventListener("abort", onAbort);
          } catch {}
        }
      }
    };

    const promise = exec().finally(() => {
      inflight.delete(key);
    });

    inflight.set(key, promise);
    return promise;
  },

  // Convenience methods
  get(path, opts) {
    return this.request(path, { ...(opts || {}), method: "GET" });
  },
  post(path, body, opts) {
    return this.request(path, { ...(opts || {}), method: "POST", body, bodyType: opts?.bodyType || "json" });
  },
  put(path, body, opts) {
    return this.request(path, { ...(opts || {}), method: "PUT", body, bodyType: opts?.bodyType || "json" });
  },
  patch(path, body, opts) {
    return this.request(path, { ...(opts || {}), method: "PATCH", body, bodyType: opts?.bodyType || "json" });
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
    const requestId = opts.requestId || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const promise = this.request(path, { ...opts, signal: controller.signal, requestId });
    return { promise, cancel: () => controller.abort(), requestId };
  },
};


export async function postJson(url, data = {}, opts = {}) {
  return api.post(url, data, opts);
}

export async function getJson(url, opts = {}) {
  return api.get(url, opts);
}

export default api;
