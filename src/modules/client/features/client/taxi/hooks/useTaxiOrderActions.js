import { useCallback } from "react";
import { message } from "antd";
import taxiApi from "../services/taxiApi";
import { taxiLogger } from "@/modules/shared/taxi/utils/taxiLogger.js";

export function useTaxiOrderActions({ cp, orderId, setStep, setOrderId, setOrderStatus, setAssignedDriver, setNearCars, setDispatchLine, speak }) {
  const handleCancel = useCallback(async (cancelReason = null) => {
    if (!orderId) {
      setStep("main");
      setOrderStatus(null);
      return;
    }

    const hide = message.loading(cp("Bekor qilinmoqda..."), 0);
    try {
      await taxiApi.cancelOrder({ action: "cancel", order_id: orderId, cancel_reason: cancelReason || undefined });
    } catch (error) {
      taxiLogger.warn("Client taxi cancel xatolik", { orderId, cancelReason, error: error?.message || String(error) });
    } finally {
      hide();
      localStorage.removeItem("activeOrderId");
      setOrderId(null);
      setOrderStatus(null);
      setAssignedDriver(null);
      setNearCars([]);
      setDispatchLine(null);
      setStep("main");
      speak(cp("Safar bekor qilindi"));
    }
  }, [cp, orderId, setAssignedDriver, setDispatchLine, setNearCars, setOrderId, setOrderStatus, setStep, speak]);

  return { handleCancel };
}
