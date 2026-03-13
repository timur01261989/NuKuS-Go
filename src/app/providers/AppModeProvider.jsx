import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const APP_MODE_STORAGE_KEY = "app_mode";
const VALID_APP_MODES = new Set(["client", "driver"]);
const DEFAULT_APP_MODE = "client";
const AppModeContext = createContext(null);

function normalizeAppMode(mode) {
  return VALID_APP_MODES.has(mode) ? mode : DEFAULT_APP_MODE;
}

function readStoredAppMode() {
  if (typeof window === "undefined") return DEFAULT_APP_MODE;
  try {
    return normalizeAppMode(window.localStorage.getItem(APP_MODE_STORAGE_KEY));
  } catch {
    return DEFAULT_APP_MODE;
  }
}

function AppModeProviderComponent({ children }) {
  const [appMode, setAppModeState] = useState(DEFAULT_APP_MODE);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setAppModeState(readStoredAppMode());
    setIsLoading(false);
  }, []);

  const setAppMode = useCallback((nextMode) => {
    const normalized = normalizeAppMode(nextMode);
    setAppModeState(normalized);

    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(APP_MODE_STORAGE_KEY, normalized);
      window.dispatchEvent(new CustomEvent("unigo:app-mode-changed", { detail: { appMode: normalized } }));
    } catch {
      // localStorage sync failure must not break UI state
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const sync = () => {
      setAppModeState(readStoredAppMode());
    };

    const onStorage = (event) => {
      if (!event || event.key === APP_MODE_STORAGE_KEY) {
        sync();
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("unigo:app-mode-changed", sync);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("unigo:app-mode-changed", sync);
    };
  }, []);

  const value = useMemo(() => ({
    appMode,
    setAppMode,
    isLoading,
  }), [appMode, isLoading, setAppMode]);

  return <AppModeContext.Provider value={value}>{children}</AppModeContext.Provider>;
}

const AppModeProvider = React.memo(AppModeProviderComponent);

function useAppMode() {
  const context = useContext(AppModeContext);

  if (!context) {
    throw new Error("useAppMode must be used within AppModeProvider");
  }

  return context;
}

export { AppModeProvider, useAppMode, APP_MODE_STORAGE_KEY, DEFAULT_APP_MODE };
