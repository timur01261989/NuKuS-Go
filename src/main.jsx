import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import ErrorBoundary from "./modules/shared/components/ErrorBoundary.jsx";
import AppErrorBoundary from "./modules/shared/debug/AppErrorBoundary.jsx";
import { installGlobalDebugRuntime } from "./modules/shared/debug/debugRuntime.js";
import AppProviders from "./app/providers/AppProviders.jsx";
import { setupNotifications } from "./services/notifications.js";
import { supabase } from "@/services/supabase/supabaseClient.js";
import { assertClientEnv } from "./config/env.js";

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

// Service worker bootstrap disabled in web deployment to avoid stale cache/manifest issues.

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
