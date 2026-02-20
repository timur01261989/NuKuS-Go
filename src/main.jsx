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
  // 1) Avval localStorage token (agar sen qo'lda login qilgan bo'lsang)
  // 2) Bo'lmasa Supabase storage token
  getAccessToken: () => readTokenFromLocalStorage() || readTokenFromSupabaseStorage(),

  setAccessToken: (t) => localStorage.setItem("token", t || ""),
  getRefreshToken: () => localStorage.getItem("refresh_token") || "",
  setRefreshToken: (t) => localStorage.setItem("refresh_token", t || ""),

  // ❗ apiHelper.js da "hooks: { onAuthFail }" degan narsa YO'Q.
  // To'g'risi: onAuthFail ni bevosita shu yerga berasan.
  onAuthFail: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");

    // Supabase tokenni ham tozalash (ixtiyoriy)
    const ref = import.meta.env.VITE_SUPABASE_PROJECT_REF;
    if (ref) localStorage.removeItem(`sb-${ref}-auth-token`);

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