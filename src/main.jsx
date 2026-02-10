import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

import "./index.css";
import "./shared/styles/fonts.css";
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
