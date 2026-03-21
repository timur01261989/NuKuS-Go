import { supabase } from "@/services/supabase/supabaseClient.js";

function getSupabaseAccessToken() {
  if (typeof window === "undefined") return "";

  try {
    const keys = Object.keys(window.localStorage || {});
    const authKey = keys.find((key) => key.startsWith("sb-") && key.endsWith("-auth-token"));

    if (!authKey) return "";

    const raw = window.localStorage.getItem(authKey);
    if (!raw) return "";

    const parsed = JSON.parse(raw);

    return (
      parsed?.access_token ||
      parsed?.currentSession?.access_token ||
      parsed?.session?.access_token ||
      ""
    );
  } catch {
    return "";
  }
}

function syncLegacyTokenFromStorage() {
  if (typeof window === "undefined") return;

  const token = getSupabaseAccessToken();
  if (token) {
    window.localStorage.setItem("token", token);
    return;
  }

  window.localStorage.removeItem("token");
}

export function installLegacyAuthTokenBridge() {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleStorage = () => {
    syncLegacyTokenFromStorage();
  };

  syncLegacyTokenFromStorage();
  window.addEventListener("storage", handleStorage);

  const { data: authSubscription } = supabase.auth.onAuthStateChange((_event, session) => {
    const token = session?.access_token || getSupabaseAccessToken();
    if (token) {
      window.localStorage.setItem("token", token);
      return;
    }
    window.localStorage.removeItem("token");
  });

  return () => {
    window.removeEventListener("storage", handleStorage);
    authSubscription?.subscription?.unsubscribe?.();
  };
}

export { getSupabaseAccessToken };
