import { useMemo } from "react";
import { TAXI_STATUS, isTaxiActive, normalizeTaxiStatus } from "@/modules/shared/taxi/constants/taxiStatuses.js";

export function useTaxiOrderDerived({ orderStatus, orderId, step, isDraggingMap }) {
  const normalizedStatus = normalizeTaxiStatus(orderStatus, TAXI_STATUS.SEARCHING);
  const isSearching = normalizedStatus === TAXI_STATUS.SEARCHING || step === "searching";
  const isDriverAssigned = isTaxiActive(normalizedStatus);
  const showSheet = step === "dest_map" ? !isDraggingMap : true;
  const shareLink = useMemo(() => {
    if (!orderId) return "";
    try {
      const origin = window.location.origin;
      return `${origin}/share/${orderId}`;
    } catch {
      return "";
    }
  }, [orderId]);
  const mapBottom = useMemo(() => {
    if (step === "main") return 280;
    if (step === "search") return 340;
    if (step === "dest_map") return 240;
    if (step === "route") return 330;
    if (step === "searching") return 240;
    if (step === "coming") return 380;
    return 240;
  }, [step]);

  return useMemo(() => ({
    isSearching,
    isDriverAssigned,
    showSheet,
    shareLink,
    mapBottom,
  }), [isSearching, isDriverAssigned, showSheet, shareLink, mapBottom]);
}
