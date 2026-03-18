import { useEffect, useMemo, useState } from "react";
import { message } from "antd";
import { supabase } from "@/services/supabase/supabaseClient";
import { useTaxi } from "../context/TaxiProvider";
import { useDriverOnline } from "../../core/useDriverOnline";
import { useTaxiSocket } from "./useTaxiSocket";
import { useDriverLocation } from "./useDriverLocation";
import { useOrderActions } from "./useOrderActions";
import { useEarnings } from "./useEarnings";
import { TAXI_STATUS, normalizeTaxiStatus } from "@/modules/shared/taxi/constants/taxiStatuses.js";
import { taxiLogger } from "@/modules/shared/taxi/utils/taxiLogger.js";

export function useDriverTaxiController() {
  const { state, dispatch } = useTaxi();
  const { isOnline: globalOnline, activeService } = useDriverOnline();
  const isOnline = globalOnline && activeService === "taxi";
  const { activeOrder, incomingOrder, ui } = state;

  const actions = useOrderActions();
  const { earnings } = useEarnings();

  useTaxiSocket({ enabled: isOnline });
  useDriverLocation({ enabled: isOnline });

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [missionsOpen, setMissionsOpen] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    dispatch({ type: "driver/setOnline", payload: isOnline });
  }, [dispatch, isOnline]);

  useEffect(() => {
    supabase.auth.getUser()
      .then(({ data }) => {
        if (data?.user?.id) setUserId(data.user.id);
      })
      .catch((error) => {
        taxiLogger.warn("Driver userId olinmadi", { error: error?.message || String(error) });
      });
  }, []);

  useEffect(() => {
    if (ui.toast) {
      message.info(ui.toast);
      dispatch({ type: "ui/clearToast" });
    }
  }, [ui.toast, dispatch]);

  const canShowLocate = !!state.driverLocation?.latlng;
  const heartbeatUpdatedAt = state.driverLocation?.updatedAt || null;
  const gpsAccuracy = state.driverLocation?.accuracy ?? null;

  const bottomMode = useMemo(() => {
    const status = normalizeTaxiStatus(activeOrder?.status, TAXI_STATUS.NEW);
    if (status === TAXI_STATUS.ON_TRIP) return "onTrip";
    if (status === TAXI_STATUS.ACCEPTED) return "goingToClient";
    if (status === TAXI_STATUS.ARRIVED) return "arrived";
    if (status === TAXI_STATUS.COMPLETED) return "completed";
    return "idle";
  }, [activeOrder?.status]);

  return {
    state,
    dispatch,
    isOnline,
    activeOrder,
    incomingOrder,
    actions,
    earnings,
    detailsOpen,
    setDetailsOpen,
    missionsOpen,
    setMissionsOpen,
    userId,
    canShowLocate,
    heartbeatUpdatedAt,
    gpsAccuracy,
    bottomMode,
  };
}
