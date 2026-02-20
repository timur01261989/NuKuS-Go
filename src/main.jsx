import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import api from "./utils/apiHelper";
import { supabase } from "./lib/supabase";

// ✅ Ant Design CSS (v5) — SHART
import "antd/dist/reset.css";

// ✅ Theme system (single source)
import "./theme/tokens.css";
import "./theme/theme-overrides.css";

// ✅ Tailwind + minimal reset
import "./index.css";

// Leaflet
import "leaflet/dist/leaflet.css";

// ------------------------------
// Safe helpers (window/localStorage bo'lmagan joylarda yiqilmasin)
// ------------------------------
const isBrowser = typeof window !== "undefined";

async function getSupabaseAccessToken() {
  if (!isBrowser) return "";
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token || "";
  } catch {
    return "";
  }
}

async function getSupabaseRefreshToken() {
  if (!isBrowser) return "";
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session?.refresh_token || "";
  } catch {
    return "";
  }
}

// ------------------------------
// API helper global config (1 marta)
// ------------------------------
api.configure({
  // ✅ apiHelper.js async token'ni qo'llaydi (await qiladi)
  getAccessToken: getSupabaseAccessToken,
  getRefreshToken: getSupabaseRefreshToken,

  onAuthFail: async () => {
    // Token yaroqsiz bo'lsa: sessionni tozalaymiz va login'ga qaytamiz
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }

    if (isBrowser && window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  },
});

// ------------------------------
// PWA / Service Worker (1 marta)
// ------------------------------
if (isBrowser && "serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");

      // Update check (new deploy bo'lsa)
      registration.update?.();

      // Agar yangi SW kelsa - avtomatik aktivlashtirib reload qilamiz
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

      console.log("Nukus Go oflayn rejimga tayyor:", registration);
    } catch (err) {
      console.log("Service Worker xatosi:", err);
    }
  });
}

// ------------------------------
// RENDERING
// ------------------------------
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
