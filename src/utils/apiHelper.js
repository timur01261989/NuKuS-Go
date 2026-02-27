import axios from "axios";

/**
 * src/utils/apiHelper.js
 * - Project-wide Axios instance (used by taxi/intercity/delivery/freight/driver modules).
 * - Vercel-friendly: defaults to '/api' (same origin).
 * - Keeps backward compatibility with older env names.
 */
const baseURL =
  (typeof import.meta !== "undefined" && import.meta?.env?.VITE_API_BASE_URL) ||
  process.env.VITE_API_BASE_URL ||
  process.env.REACT_APP_API_BASE_URL ||
  "/api";

const api = axios.create({
  baseURL,
  timeout: 30_000,
});

// Attach token if present (optional; safe no-op)
api.interceptors.request.use((config) => {
  try {
    const token =
      (typeof window !== "undefined" && window.localStorage?.getItem("token")) || null;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch (_) {}
  return config;
});

// Normalize errors (so UI can show consistent messages)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "Network error";
    err.normalizedMessage = message;
    return Promise.reject(err);
  }
);

export default api;
