import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import ErrorBoundary from "./modules/shared/components/ErrorBoundary.jsx";
import AppErrorBoundary from "./modules/shared/debug/AppErrorBoundary.jsx";
import { installGlobalDebugRuntime } from "./modules/shared/debug/debugRuntime.js";
import AppProviders from "./app/providers/AppProviders.jsx";
import { setupNotifications } from "./services/notifications.js";
import { supabase } from "@/services/supabase/supabaseClient.js";

import "antd/dist/reset.css";
import "leaflet/dist/leaflet.css";
import "./styles/globals.css";

function getSupabaseAccessToken() {
  if (typeof window === "undefined") return "";

  try {
    const keys = Object.keys(window.localStorage || {});
    const authKey = keys.find((key) => key.startsWith("sb-") && key.endsWith("-auth-token"));

    if (!authKey) return "";

    const raw = window.localStorage.getItem(authKey);
    if (!raw) return "";

    const parsed = JSON.parse(raw);

    return parsed?.access_token || parsed?.currentSession?.access_token || parsed?.session?.access_token || "";
  } catch {
    return "";
  }
}

function installLegacyAuthTokenBridge() {
  if (typeof window === "undefined") return;

  const syncLegacyToken = () => {
    const token = getSupabaseAccessToken();
    if (token) {
      window.localStorage.setItem("token", token);
      return;
    }
    window.localStorage.removeItem("token");
  };

  syncLegacyToken();

  window.addEventListener("storage", syncLegacyToken);

  supabase.auth.onAuthStateChange((_event, session) => {
    const token = session?.access_token || getSupabaseAccessToken();
    if (token) {
      window.localStorage.setItem("token", token);
    } else {
      window.localStorage.removeItem("token");
    }
  });
}

installGlobalDebugRuntime();
installLegacyAuthTokenBridge();

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
          if (installing.state === "installed" && navigator.serviceWorker.controller) {
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
        // Push setup error must not break bootstrap.
      }
    } catch {
      // Service worker registration error must not break bootstrap.
    }
  });
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element with id 'root' not found");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <AppProviders>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </AppProviders>
    </AppErrorBoundary>
  </React.StrictMode>,
);
