import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import api from "./utils/apiHelper";

// ✅ Ant Design CSS (v5) — SHART
import "antd/dist/reset.css";

// ✅ Theme system (single source)
// 1) tokens: ranglar + shriftlar + night-mode variablelar
import "./theme/tokens.css";
// 2) minimal overrides: premium black cards default (AntD ichida text yo'qolmasin)
import "./theme/theme-overrides.css";

// ✅ Tailwind + minimal reset (endi bu faylda rang/theme bo'lmaydi)
import "./index.css";

// Leaflet
import "leaflet/dist/leaflet.css";

// ------------------------------
// Auth token helpers (Supabase-friendly)
// ------------------------------
function getSupabaseAccessTokenFromStorage() {
  // Supabase token localStorage'da: sb-<project-ref>-auth-token
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith("sb-") && key.endsWith("-auth-token")) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw);

        // Supabase versionlariga qarab turli shape bo'lishi mumkin
        return (
          parsed?.access_token ||
          parsed?.currentSession?.access_token ||
          parsed?.session?.access_token ||
          ""
        );
      } catch {
        // ignore parse errors
      }
    }
  }
  return "";
}

// ------------------------------
// API helper global config (1 marta)
// ------------------------------
api.configure({
  // Har requestda tokenni qayta topamiz (token refresh bo'lsa ham yangilanadi)
  getAccessToken: () => {
    // Agar sen boshqa auth ham ishlatsang, shu yerdan qo'shib ketasan:
    // const legacy = localStorage.getItem("token") || "";
    // if (legacy) return legacy;

    return getSupabaseAccessTokenFromStorage();
  },

  // apiHelper ichida "hooks: { onAuthFail }" yo'q — to'g'ridan-to'g'ri onAuthFail ishlaydi
  onAuthFail: () => {
    // Token yaroqsiz bo'lsa tozalaymiz va login ga qaytaramiz
    // (Supabase token ham shu yerda ketadi)
    localStorage.clear();
    if (window.location.pathname !== "/login") window.location.href = "/login";
  },
});

// ------------------------------
// PWA / Service Worker (1 marta)
// ------------------------------
if ("serviceWorker" in navigator) {
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
          // "installed" bo'lganda eski controller bo'lsa - demak update bor
          if (installing.state === "installed" && navigator.serviceWorker.controller) {
            // skipWaiting so'raymiz (sw.js ichida message handler bo'lishi kerak)
            registration.waiting?.postMessage({ type: "SKIP_WAITING" });
          }
        });
      });

      navigator.serviceWorker.addEventListener("controllerchange", () => {
        // Yangi SW control olganda 1 marta reload
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