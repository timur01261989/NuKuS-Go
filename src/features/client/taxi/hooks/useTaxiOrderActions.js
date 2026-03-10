import { useCallback } from "react";
import { message } from "antd";
import taxiApi from "../services/taxiApi";

export function useTaxiOrderActions({ cp, orderId, setStep, setOrderId, setOrderStatus, setAssignedDriver, setNearCars, setDispatchLine, speak }) {
  const handleCancel = useCallback(async () => {
    if (!orderId) {
      setStep("main");
      setOrderStatus(null);
      return;
    }

    const hide = message.loading(cp("Bekor qilinmoqda..."), 0);
    try {
      await taxiApi.cancelOrder({ action: "cancel", order_id: orderId });
    } catch (error) {
      console.warn(error);
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
