import { useEffect, useRef, useState } from "react";
import { message } from "antd";
import api from "@/modules/shared/utils/apiHelper";
import {
  buildDriverOrderFeedStats,
  loadInitialDriverService,
  persistDriverService,
} from "./driverOrderFeed.logic.js";

export function useDriverOrderFeedController() {
  const [selectedService, setSelectedService] = useState(loadInitialDriverService);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats] = useState(buildDriverOrderFeedStats);
  const drawerInnerRef = useRef(null);

  useEffect(() => {
    persistDriverService(selectedService);
  }, [selectedService]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await api.get?.("/api/driver/availability");
        if (mounted && typeof data?.online === "boolean") {
          setIsOnline(data.online);
        }
      } catch {
        // ignore legacy availability probe
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const toggleDarkMode = () => {
    message.info("Legacy feed uchun tungi rejim sozlamasi hali global theme bilan bog‘lanmagan");
  };

  const toggleOnline = async (checked) => {
    setLoading(true);
    try {
      setIsOnline(!!checked);
      message.success(checked ? "Ishga chiqdingiz" : "Ishdan chiqdingiz");
    } catch (error) {
      message.error(error?.message || "Holatni o‘zgartirib bo‘lmadi");
    } finally {
      setLoading(false);
    }
  };

  return {
    selectedService,
    setSelectedService,
    profileOpen,
    setProfileOpen,
    isOnline,
    loading,
    stats,
    drawerInnerRef,
    toggleDarkMode,
    toggleOnline,
  };
}
