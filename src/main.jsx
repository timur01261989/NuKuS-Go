import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import api from "./utils/apiHelper";

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
// Helpers: token olish
// ------------------------------
function readTokenFromLocalStorage() {
  // Agar sen o'zing token saqlayotgan bo'lsang (login endpoint orqali)
  return localStorage.getItem("token") || "";
}

function readTokenFromSupabaseStorage() {
  // Supabase default storage kaliti project ref bilan bo'ladi.
  // Agar VITE_SUPABASE_PROJECT_REF yo'q bo'lsa, bu null qaytaradi.
  const ref = import.meta.env.VITE_SUPABASE_PROJECT_REF;
  if (!ref) return "";

  const raw = localStorage.getItem(`sb-${ref}-auth-token`);
  if (!raw) return "";

  try {
    const parsed = JSON.parse(raw);
    // ba'zi versiyalarda { access_token }, ba'zilarida { currentSession: { access_token } } bo'lishi mumkin
    return parsed?.access_token || parsed?.currentSession?.access_token || "";
  } catch {
    return "";
  }
}

// ------------------------------
// API helper global config (1 marta)
// ------------------------------
api.configure({
  getAccessToken: () => {
    // Supabase localStorage ichidan avtomatik topadi
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith("sb-") && key.endsWith("-auth-token")) {
        try {
          const raw = JSON.parse(localStorage.getItem(key));
          return (
            raw?.access_token ||
            raw?.currentSession?.access_token ||
            raw?.session?.access_token ||
            ""
          );
        } catch {}
      }
    }
    return "";
  },

  onAuthFail: () => {
    localStorage.clear();
    window.location.href = "/login";
  }
});

// ------------------------------
// PWA / Service Worker (1 marta)
// ------------------------------
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      registration.update?.();

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