import { useEffect, useState } from "react";

const LS_NOTIF = "app_notifications_enabled";

export function useAppPrefs() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const v = localStorage.getItem(LS_NOTIF);
    return v ? v === "1" : true; // default true
  });

  useEffect(() => {
    localStorage.setItem(LS_NOTIF, notificationsEnabled ? "1" : "0");
  }, [notificationsEnabled]);

  return {
    notificationsEnabled,
    setNotificationsEnabled,
  };
}
