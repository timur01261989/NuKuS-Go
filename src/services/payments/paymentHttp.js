import { supabase } from "@/services/supabase/supabaseClient";

export const API_BASE = (import.meta?.env?.VITE_API_BASE || "").replace(/\/$/, "");

export async function getAccessToken() {
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token || null;
  } catch {
    return null;
  }
}

export async function authHeaders(extraHeaders = {}) {
  const token = await getAccessToken();
  return {
    ...extraHeaders,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function getJson(path, init = {}) {
  const headers = await authHeaders(init.headers || {});
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    method: init.method || "GET",
    headers,
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok || json?.ok === false) {
    throw new Error(json?.error || `HTTP ${response.status}`);
  }
  return json;
}

export async function postJson(path, body = {}, init = {}) {
  const headers = await authHeaders({
    "Content-Type": "application/json",
    ...(init.headers || {}),
  });

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    method: "POST",
    headers,
    body: JSON.stringify(body || {}),
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok || json?.ok === false) {
    throw new Error(json?.error || `HTTP ${response.status}`);
  }
  return json;
}

export function buildQueryString(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}
