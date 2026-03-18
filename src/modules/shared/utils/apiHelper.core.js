// Shared helpers for apiHelper.js
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const randomJitter = (base) => {
  const delta = base * 0.2;
  return base + (Math.random() * 2 - 1) * delta;
};

export const isPlainObject = (v) =>
  v != null && typeof v === "object" && Object.getPrototypeOf(v) === Object.prototype;

export const safeTrimSlash = (s) => (s || "").replace(/\/+$/, "");

export const joinUrl = (base, path) => {
  const p = (path || "").toString();
  if (/^https?:\/\//i.test(p)) return p;
  const b = safeTrimSlash(base || "");
  const pp = p.replace(/^\/+/, "");
  if (!b) return `/${pp}`.replace(/\/+$/, "");
  return `${b}/${pp}`;
};

export const toQueryString = (query) => {
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
      params.set(k, JSON.stringify(v));
    } else {
      params.set(k, String(v));
    }
  }
  const s = params.toString();
  return s ? `?${s}` : "";
};

export const stableStringify = (obj) => {
  if (obj === null || obj === undefined) return "";
  if (typeof obj !== "object") return String(obj);
  if (Array.isArray(obj)) return `[${obj.map(stableStringify).join(",")}]`;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${k}:${stableStringify(obj[k])}`).join(",")}}`;
};

export const buildKey = ({ method, url, query, body, bodyType }) => {
  const q = query ? stableStringify(query) : "";
  const b = bodyType === "form" ? "[form]" : stableStringify(body);
  return `${method} ${url}${q ? " " + q : ""}${b ? " " + b : ""}`;
};

export const pickHeadersObj = (headers) => {
  const obj = {};
  if (!headers) return obj;
  for (const [k, v] of headers.entries()) obj[k] = v;
  return obj;
};

export const inflight = new Map();
export const cache = new Map();

export const getCached = (key) => {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.ts > hit.ttl) {
    cache.delete(key);
    return null;
  }
  return hit.data;
};

export const setCached = (key, data, ttl) => {
  cache.set(key, { ts: Date.now(), ttl, data });
};
