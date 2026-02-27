import axios from "axios";

/**
 * Centralized Axios instance for Auto Market feature.
 * - Keep ALL network configuration here: baseURL, timeout, interceptors.
 * - Individual services (cars/ai/payments/...) should only call this client.
 */
export const axiosClient = axios.create({
  baseURL: import.meta?.env?.VITE_API_BASE_URL || process.env.REACT_APP_API_BASE_URL || "/api",
  timeout: 30_000,
});

// Attach token if present (optional)
axiosClient.interceptors.request.use((config) => {
  const token =
    (typeof window !== "undefined" && window.localStorage?.getItem("token")) || null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Normalize errors
axiosClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "Network error";
    return Promise.reject(new Error(message));
  }
);
