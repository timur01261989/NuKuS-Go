import { useCallback, useEffect, useMemo, useState } from "react";

function safeNightModeValue(v) {
  return v === "on" || v === "off" || v === "auto" ? v : "auto";
}

function isAutoDarkNow() {
  const hour = new Date().getHours();
  return hour >= 20 || hour < 6;
}

function applyBodyClass(isDark) {
  if (typeof document === "undefined") return;
  const cls = "night-mode-active";
  if (isDark) document.body.classList.add(cls);
  else document.body.classList.remove(cls);
}

/**
 * useThemeMode
 *
 * Source of truth: localStorage key "nightMode" with values:
 *  - "auto" (default)
 *  - "on"
 *  - "off"
 *
 * Features:
 *  - Applies/removes body class "night-mode-active"
 *  - Supports auto mode by local time (20:00-06:00)
 *  - Reacts to changes from Settings via:
 *      window.dispatchEvent(new Event("nightModeChanged"))
 *    and cross-tab changes via storage event.
 */
export function useThemeMode() {
  const [nightMode, setNightModeState] = useState("auto"); // "auto" | "on" | "off"
  const [autoDark, setAutoDark] = useState(false);

  // init from localStorage
  useEffect(() => {
    const saved = safeNightModeValue(
      typeof window !== "undefined" ? window.localStorage.getItem("nightMode") : "auto"
    );
    setNightModeState(saved);
    setAutoDark(isAutoDarkNow());
  }, []);

  // auto dark updater (only when nightMode === "auto")
  useEffect(() => {
    if (nightMode !== "auto") return;

    const update = () => setAutoDark(isAutoDarkNow());
    update();

    // har 60s tekshiradi (xohlasangiz 30s ham qilsa bo‘ladi)
    const id = setInterval(update, 60 * 1000);
    return () => clearInterval(id);
  }, [nightMode]);

  // derived isDark
  const isDark = useMemo(() => {
    if (nightMode === "on") return true;
    if (nightMode === "off") return false;
    return autoDark;
  }, [nightMode, autoDark]);

  // apply body class when isDark changes
  useEffect(() => {
    applyBodyClass(isDark);
  }, [isDark]);

  // public setter (also writes to localStorage + emits event)
  const setNightMode = useCallback((mode) => {
    const next = safeNightModeValue(mode);
    setNightModeState(next);

    if (typeof window !== "undefined") {
      window.localStorage.setItem("nightMode", next);
      // shu tab ichida boshqa komponentlar darhol bilishi uchun
      window.dispatchEvent(new Event("nightModeChanged"));
    }
  }, []);

  // listen: changes from Settings or other tabs
  useEffect(() => {
    const syncFromStorage = () => {
      const v = safeNightModeValue(window.localStorage.getItem("nightMode"));
      setNightModeState(v);
    };

    const onCustom = () => syncFromStorage();

    const onStorage = (e) => {
      if (e.key === "nightMode") syncFromStorage();
    };

    window.addEventListener("nightModeChanged", onCustom);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("nightModeChanged", onCustom);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return {
    nightMode,   // "auto" | "on" | "off"
    isDark,      // boolean (resolved)
    setNightMode // function
  };
}
