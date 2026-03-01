import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import AuthProvider from "@/shared/auth/AuthProvider";
import api from "@/utils/apiHelper";
import { setupNotifications } from "@/services/notifications";
import { supabase } from "@/lib/supabase";

// ✅ Ant Design reset
import "antd/dist/reset.css";

// ✅ Theme
import "./theme/tokens.css";
import "./theme/theme-overrides.css";

// ✅ Tailwind / global styles
import "./index.css";

// ✅ Leaflet
import "leaflet/dist/leaflet.css";

/**
 * Supabase access token'ni localStorage'dagi sb-...-auth-token dan olish
 * (Vercel deploy'dan keyin "token" bo'sh bo'lib qolsa ham ishlaydi)
 */
function getSupabaseAccessToken() {
  if (typeof window === "undefined") return "";
  try {
    const keys = Object.keys(window.localStorage || {});
    const k = keys.find((x) => x.startsWith("sb-") && x.endsWith("-auth-token"));
    if (!k) return "";
    const raw = window.localStorage.getItem(k);
    if (!raw) return "";
    const parsed = JSON.parse(raw);
    return (
      parsed?.access_token ||
      parsed?.currentSession?.access_token ||
      parsed?.session?.access_token ||
      ""
    );
  } catch {
    return "";
  }
}

/* ============================
   API HELPER CONFIG
============================ */
api.configure({
  // 1) avval Supabase token, 2) keyin eski "token" (agar sizda custom auth bo'lsa)
  getAccessToken: () => {
    const sb = getSupabaseAccessToken();
    if (sb) return sb;
    return typeof window !== "undefined"
      ? window.localStorage.getItem("token") || ""
      : "";
  },

  setAccessToken: (t) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("token", t || "");
    }
  },

  getRefreshToken: () =>
    typeof window !== "undefined"
      ? window.localStorage.getItem("refresh_token") || ""
      : "",

  setRefreshToken: (t) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("refresh_token", t || "");
    }
  },

  hooks: {
    onAuthFail: () => {
      if (typeof window === "undefined") return;

      window.localStorage.removeItem("token");
      window.localStorage.removeItem("refresh_token");

      // Supabase auth token'larini ham tozalab yuboramiz (ixtiyoriy, lekin foydali)
      try {
        const keys = Object.keys(window.localStorage || {});
        keys
          .filter((x) => x.startsWith("sb-") && x.endsWith("-auth-token"))
          .forEach((x) => window.localStorage.removeItem(x));
      } catch {}

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
      const registration = await navigator.serviceWorker.register("/sw.js");

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

      navigator.serviceWorker.addEventListener("controllerchange", () => {
        window.location.reload();
      });

      // SW muvaffaqiyatli ro'yxatdan o'tdi
      // Push notifications ni yoqish (userId bilan saqlash uchun)
      try {
        const { data: authData } = await supabase.auth.getUser();
        const userId = authData?.user?.id || null;
        await setupNotifications(userId);
      } catch {
        // push setup ilovaga ta'sir qilmaydi
      }
    } catch (e) {
      // SW xatosi — ilovaga ta'sir qilmaydi, jimgina o'tib ketadi
    }
  });
}

/* ============================
   RENDER
============================ */
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
