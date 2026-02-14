import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

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

// --- PWA / Service Worker (1 marta) ---
// ⚠️ NOTE:
// Service Worker ba'zida eski build (JS bundle) ni keshdan berib qo'yadi.
// Natijada siz kodni to'g'rilagan bo'lsangiz ham brauzer "oq ekran" va
// eski xatolarni ko'rsatishi mumkin.
// Shuni oldini olish uchun PROD muhitda avval eski SW + cache'larni tozalab,
// keyin qayta register qilamiz.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      // PROD'da eski kesh muammolarini bartaraf qilish
      if (import.meta?.env?.PROD) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));

        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      // Har reload'da yangilanishni tekshir
      registration.update?.();
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
