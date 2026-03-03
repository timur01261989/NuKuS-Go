import { supabase } from "../lib/supabase";

const API_BASE = (import.meta?.env?.VITE_API_BASE || '').replace(/\/$/, '');

async function getAccessToken() {
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token || null;
  } catch {
    return null;
  }
}

async function authHeaders() {
  const token = await getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function getJson(path) {
  const headers = await authHeaders();
  const r = await fetch(`${API_BASE}${path}`, { headers });
  const j = await r.json().catch(()=>({}));
  if (!r.ok || j?.ok === false) throw new Error(j?.error || `HTTP ${r.status}`);
  return j;
}

async function postJson(path, body) {
  const headers = { 'Content-Type': 'application/json', ...(await authHeaders()) };
  const r = await fetch(`${API_BASE}${path}`, { method:'POST', headers, body: JSON.stringify(body||{}) });
  const j = await r.json().catch(()=>({}));
  if (!r.ok || j?.ok === false) throw new Error(j?.error || `HTTP ${r.status}`);
  return j;
}

// If user_id is omitted, server will use the authed user id.
export function getWalletBalance(user_id) {
  const q = user_id ? `?user_id=${encodeURIComponent(user_id)}` : '';
  return getJson(`/api/wallet-balance${q}`);
}

export function demoTopup(user_id, amount_uzs) {
  return postJson('/api/wallet-topup-demo', { user_id, amount_uzs });
}
