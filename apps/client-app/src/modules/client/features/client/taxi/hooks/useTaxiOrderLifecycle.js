import { useMemo } from "react";
import { useOrderStatusPolling, useRestoreActiveOrder } from "./useTaxiOrderPolling";

export function useTaxiOrderLifecycle(params) {
  const {
    orderId,
    pickup,
    orderStatus,
    step,
    assignedDriver,
    setOrderId,
    setOrderStatus,
    setPickup,
    setDest,
    setStep,
    setAssignedDriver,
    setCompletedOrderForRating,
    setRatingVisible,
    setEarnedBonus,
    setEtaMin,
    setEtaUpdatedAt,
    cp,
    speak,
  } = params;

  useRestoreActiveOrder({ setOrderId, setOrderStatus, setPickup, setDest, setStep });
  useOrderStatusPolling({
    orderId,
    pickup,
    orderStatus,
    step,
    assignedDriver,
    setOrderStatus,
    setAssignedDriver,
    setCompletedOrderForRating,
    setRatingVisible,
    setEarnedBonus,
    setEtaMin,
    setEtaUpdatedAt,
    cp,
    speak,
  });

  return useMemo(() => ({ orderId, orderStatus, assignedDriver }), [orderId, orderStatus, assignedDriver]);
}
