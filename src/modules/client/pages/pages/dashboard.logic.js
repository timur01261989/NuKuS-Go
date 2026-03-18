import { useCallback, useEffect, useMemo, useState } from "react";
import { message } from "antd";
import { supabase } from "@/services/supabase/supabaseClient";
import { applyNightModeClass, buildLangMenu, buildMenuItems, buildServices } from "./dashboard.helpers.jsx";

export function useDashboardController({ navigate, t, tx, setLanguage }) {
  const [open, setOpen] = useState(false);
  const [currentView, setCurrentView] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [nightMode, setNightMode] = useState("auto");

  useEffect(() => {
    const saved = localStorage.getItem("nightMode");
    if (saved === "on" || saved === "off" || saved === "auto") {
      setNightMode(saved);
    } else {
      setNightMode("auto");
      localStorage.setItem("nightMode", "auto");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("nightMode", nightMode);

    if (nightMode === "on") {
      applyNightModeClass(true);
      return;
    }
    if (nightMode === "off") {
      applyNightModeClass(false);
      return;
    }

    const updateAuto = () => {
      const hour = new Date().getHours();
      applyNightModeClass(hour >= 20 || hour < 6);
    };
    updateAuto();
    const interval = setInterval(updateAuto, 60 * 1000);
    return () => clearInterval(interval);
  }, [nightMode]);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) navigate("/");
    };
    checkSession();

    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, [navigate]);

  const toggleDrawer = useCallback(() => setOpen((prev) => !prev), []);

  const changeLang = useCallback((newLang) => {
    setLanguage?.(newLang);
    message.success(t.languageChanged || tx("languageChanged", "Til o'zgartirildi"));
  }, [setLanguage, t, tx]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    message.success(t.loggedOut);
    navigate("/");
  }, [navigate, t]);

  const menuItems = useMemo(() => buildMenuItems(t, logout), [t, logout]);
  const langMenu = useMemo(() => buildLangMenu(tx, changeLang), [tx, changeLang]);
  const services = useMemo(() => buildServices(t), [t]);

  return {
    open,
    setOpen,
    currentView,
    setCurrentView,
    loading,
    nightMode,
    setNightMode,
    toggleDrawer,
    menuItems,
    langMenu,
    services,
  };
}
