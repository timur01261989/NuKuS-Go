import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

export function createApiClient(baseURL: string, getToken?: () => string | null): AxiosInstance {
  const client = axios.create({ baseURL, timeout: 15000, headers: { "Content-Type": "application/json" } });

  // Request interceptor — attach token
  client.interceptors.request.use((config) => {
    const token = getToken?.();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  // Response interceptor — normalize errors
  client.interceptors.response.use(
    (res: AxiosResponse) => res,
    async (error) => {
      if (error.response?.status === 401) {
        // Token expired — attempt refresh
        try {
          const refreshToken = localStorage.getItem("refresh_token");
          if (refreshToken) {
            const { data } = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
            localStorage.setItem("access_token", data.accessToken);
            error.config.headers.Authorization = `Bearer ${data.accessToken}`;
            return client(error.config);
          }
        } catch { localStorage.clear(); window.location.href = "/login"; }
      }
      return Promise.reject(error);
    }
  );

  return client;
}

export const apiClient = createApiClient(
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) ||
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_BASE_URL) ||
  "/api",
  () => typeof localStorage !== "undefined" ? localStorage.getItem("access_token") : null
);
