import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import api from "./utils/apiHelper";

// ✅ Ant Design reset
import "antd/dist/reset.css";

// ✅ Theme
import "./theme/tokens.css";
import "./theme/theme-overrides.css";

// ✅ Tailwind / global styles
import "./index.css";

// ✅ Leaflet
import "leaflet/dist/leaflet.css";

/* ============================
   API HELPER CONFIG
============================ */
api.configure({
  getAccessToken: () =>
    typeof window !== "undefined"
      ? localStorage.getItem("token") || ""
      : "",

  setAccessToken: (t) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("token", t || "");
    }
  },

  getRefreshToken: () =>
    typeof window !== "undefined"
      ? localStorage.getItem("refresh_token") || ""
      : "",

  setRefreshToken: (t) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("refresh_token", t || "");
    }
  },

  hooks: {
    onAuthFail: () => {
      if (typeof window === "undefined") return;

      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    },
  },
});

/* ============================
   SERVICE WORKER (SAFE)
============================ */
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registration =
        await navigator.serviceWorker.register("/sw.js");

      registration.update?.();

      registration.addEventListener("updatefound", () => {
        const installing = registration.installing;
        if (!installing) return;

        installing.addEventListener("statechange", () => {
          if (
            installing.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            registration.waiting?.postMessage({
              type: "SKIP_WAITING",
            });
          }
        });
      });

      navigator.serviceWorker.addEventListener(
        "controllerchange",
        () => window.location.reload()
      );

      console.log("Nukus Go offline ready");
    } catch (e) {
      console.log("SW error:", e);
    }
  });
}

/* ============================
   RENDER
============================ */
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);