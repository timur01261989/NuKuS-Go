import { useCallback, useEffect, useState } from "react";
import { message } from "antd";
import { useNavigate } from "react-router-dom";
import { resolveLegacyDriverStatus } from "./driverAuth.logic.js";

export function useDriverAuthController({ onBack }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading");
  const [loading, setLoading] = useState(false);

  const checkDriverStatus = useCallback(async () => {
    try {
      setStatus("loading");
      const result = await resolveLegacyDriverStatus();
      setStatus(result.status);
      return result;
    } catch (error) {
      console.error("Driver status tekshirishda xato:", error);
      message.error("Statusni aniqlab bo‘lmadi");
      setStatus("none");
      return { status: "none" };
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (!isMounted) return;
      await checkDriverStatus();
    })();
    return () => {
      isMounted = false;
    };
  }, [checkDriverStatus]);

  const handleLoginRedirect = useCallback(() => {
    navigate("/login", { replace: true, state: { from: "/driver" } });
  }, [navigate]);

  const handleRetry = useCallback(async () => {
    setLoading(true);
    try {
      await checkDriverStatus();
    } finally {
      setLoading(false);
    }
  }, [checkDriverStatus]);

  return {
    onBack,
    status,
    loading,
    checkDriverStatus,
    handleLoginRedirect,
    handleRetry,
  };
}
