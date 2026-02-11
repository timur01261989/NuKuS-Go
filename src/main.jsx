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
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("Nukus Go oflayn rejimga tayyor:", registration);
      })
      .catch((err) => {
        console.log("Service Worker xatosi:", err);
      });
  });
}

// --- RENDERING ---
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
