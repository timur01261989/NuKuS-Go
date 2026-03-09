import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import QueryProvider from "./providers/QueryProvider.jsx";
import { AuthProvider } from "@/shared/auth/AuthProvider";
import AppErrorBoundary from "@/shared/debug/AppErrorBoundary";
import { installGlobalDebugRuntime } from "@/shared/debug/debugRuntime";
import api from "@/utils/apiHelper";
import { setupNotifications } from "@/services/notifications";
import { supabase } from "@/lib/supabase";

// ✅ Ant Design reset
import "antd/dist/reset.css";

// ✅ Theme
import "./theme/tokens.css";
import "./theme/theme-overrides.css";

// ✅ Tailwind / global styles
import "./index.css";

// ✅ Leaflet
import "leaflet/dist/leaflet.css";

/**
 * Supabase access token'ni localStorage'dagi sb-...-auth-token dan olish.
 * Vercel deploy'dan keyin eski custom token bo'sh bo'lib qolsa ham ishlaydi.
 */
function getSupabaseAccessToken() {
  if (typeof window === "undefined") return "";

  try {
    const keys = Object.keys(window.localStorage || {});
    const authKey = keys.find(
      (key) => key.startsWith("sb-") && key.endsWith("-auth-token")
    );

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

/* ============================
   GLOBAL DEBUG RUNTIME
============================ */
installGlobalDebugRuntime();

/* ============================
   API HELPER CONFIG
============================ */
api.configure({
  getAccessToken: () => {
    const supabaseToken = getSupabaseAccessToken();
    if (supabaseToken) return supabaseToken;

    return typeof window !== "undefined"
      ? window.localStorage.getItem("token") || ""
      : "";
  },

  setAccessToken: (token) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("token", token || "");
    }
  },

  getRefreshToken: () =>
    typeof window !== "undefined"
      ? window.localStorage.getItem("refresh_token") || ""
      : "",

  setRefreshToken: (token) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("refresh_token", token || "");
    }
  },

  hooks: {
    onAuthFail: () => {
      if (typeof window === "undefined") return;

      window.localStorage.removeItem("token");
      window.localStorage.removeItem("refresh_token");

      try {
        const keys = Object.keys(window.localStorage || {});
        keys
          .filter((key) => key.startsWith("sb-") && key.endsWith("-auth-token"))
          .forEach((key) => window.localStorage.removeItem(key));
      } catch {
        // localStorage cleanup xatosi ilovani to'xtatmasin
      }

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    },
  },
});

/* ============================
   SERVICE WORKER (SAFE)
============================ */
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");

      if (typeof registration.update === "function") {
        registration.update();
      }

      registration.addEventListener("updatefound", () => {
        const installing = registration.installing;
        if (!installing) return;

        installing.addEventListener("statechange", () => {
          if (
            installing.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            registration.waiting?.postMessage({ type: "SKIP_WAITING" });
          }
        });
      });

      navigator.serviceWorker.addEventListener("controllerchange", () => {
        window.location.reload();
      });

      try {
        const { data: authData } = await supabase.auth.getUser();
        const userId = authData?.user?.id || null;
        await setupNotifications(userId);
      } catch {
        // push setup xatosi asosiy ilovani sindirmasin
      }
    } catch {
      // service worker xatosi asosiy ilovani sindirmasin
    }
  });
}

/* ============================
   RENDER
============================ */
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element with id 'root' not found");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <AuthProvider>
        <QueryProvider>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </QueryProvider>
      </AuthProvider>
    </AppErrorBoundary>
  </React.StrictMode>
);
