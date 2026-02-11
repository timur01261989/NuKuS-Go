import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ConfigProvider, theme as antdTheme } from "antd";

const ThemeContext = createContext(null);

const LS_KEY = "app_theme_mode"; // "light" | "dark" | "auto"

function getInitialMode() {
  const saved = localStorage.getItem(LS_KEY);
  return saved || "auto";
}

function prefersDark() {
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function AppThemeProvider({ children }) {
  const [mode, setMode] = useState(getInitialMode); // light | dark | auto
  const [resolved, setResolved] = useState("light"); // light | dark

  useEffect(() => {
    const applyResolved = () => {
      const r = mode === "auto" ? (prefersDark() ? "dark" : "light") : mode;
      setResolved(r);

      // Optional: body class bilan css yozsangiz
      document.documentElement.setAttribute("data-theme", r);
    };

    applyResolved();

    // auto bo‘lsa OS theme o‘zgarsa ham update bo‘lsin
    if (mode === "auto" && window.matchMedia) {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => applyResolved();
      mq.addEventListener?.("change", handler);
      return () => mq.removeEventListener?.("change", handler);
    }
  }, [mode]);

  const value = useMemo(
    () => ({
      mode,
      setMode: (m) => {
        setMode(m);
        localStorage.setItem(LS_KEY, m);
      },
      resolved,
      isDark: resolved === "dark",
    }),
    [mode, resolved]
  );

  const algorithm = resolved === "dark" ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm;

  return (
    <ThemeContext.Provider value={value}>
      <ConfigProvider theme={{ algorithm }}>
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useAppTheme must be used inside <AppThemeProvider />");
  return ctx;
}
