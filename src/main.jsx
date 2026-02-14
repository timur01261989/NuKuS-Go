import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import api from "./utils/apiHelper";

// ✅ Ant Design CSS (v5) — SHART
import "antd/dist/reset.css";

// ✅ Theme system (single source)
// 1) tokens: ranglar + shriftlar + night-mode variablelar
import "./theme/tokens.css";
// 2) minimal overrides: premium black cards default (AntD ichida text yo‘qolmasin)
import "./theme/theme-overrides.css";

// ✅ Tailwind + minimal reset (endi bu faylda rang/theme bo‘lmaydi)
import "./index.css";

// Leaflet
import "leaflet/dist/leaflet.css";
// --- API helper global config (1 marta) ---
api.configure({
  // Agar siz tokenlarni boshqa nom bilan saqlasangiz, shu yerda o'zgartiring:
  getAccessToken: () => localStorage.getItem("token") || "",
  setAccessToken: (t) => localStorage.setItem("token", t || ""),
  getRefreshToken: () => localStorage.getItem("refresh_token") || "",
  setRefreshToken: (t) => localStorage.setItem("refresh_token", t || ""),
  // 401 bo'lsa token yangilash kerak bo'lsa shu funksiyani ulab qo'yasiz.
  // refreshAccessToken: async ({ refreshToken }) => {
  //   const data = await api.post("/api/auth/refresh", { refreshToken }, { includeAuth: false });
  //   return { accessToken: data?.accessToken, refreshToken: data?.refreshToken };
  // },
  hooks: {
    onAuthFail: () => {
      // Token yaroqsiz bo'lsa tozalab login ga qaytaramiz
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
      if (window.location.pathname !== "/login") window.location.href = "/login";
    },
  },
});

// --- PWA / Service Worker (1 marta) ---
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

// --- RENDERING ---
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);