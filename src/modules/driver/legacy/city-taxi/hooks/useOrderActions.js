import { useCallback } from "react";
import { message } from "antd";
import { useTaxi } from "../context/TaxiProvider";
import { TaxiOrderStatus } from "../context/taxiReducer";
import { cityTaxiApi } from "../services/cityTaxiApi";
import { useDriverOnline } from "../../core/useDriverOnline";
import { canActivateService } from "../../core/serviceGuards";

/**
 * useOrderActions.js
 * Accept/Decline/Arrived/StartTrip/Complete/Cancel + Online toggle
 */
export function useOrderActions() {
  const { state, dispatch } = useTaxi();
  const { isOnline: globalOnline, activeService, setOnline, setOffline } = useDriverOnline();
  const serviceType = "taxi";


const toggleOnline = useCallback(async () => {
  const next = !(globalOnline && activeService === serviceType);
  if (next && !canActivateService(activeService, serviceType)) {
    message.warning("Avval boshqa xizmatni offline qiling");
    return;
  }

  dispatch({ type: "driver/setOnline", payload: next });
  dispatch({ type: "ui/toast", payload: next ? "Online" : "Offline" });

  try {
    await cityTaxiApi.setDriverOnline(next);
    if (next) await setOnline(serviceType);
    else await setOffline();
  } catch {
    // ignore
  }

  if (!next) {
    dispatch({ type: "orders/setIncoming", payload: null });
    dispatch({ type: "orders/setActive", payload: null });
  }
}, [globalOnline, activeService, dispatch, setOnline, setOffline]);

  const accept = useCallback(async (id) => {
    const hide = message.loading("Buyurtma qabul qilinmoqda...", 0);
    try {
      const res = await cityTaxiApi.accept(id);
      dispatch({ type: "orders/setIncoming", payload: null });
      dispatch({ type: "orders/setActive", payload: normalizeActive(res, TaxiOrderStatus.ACCEPTED) });
      message.success("Qabul qilindi");
    } catch (e) {
      message.error("Qabul qilishda xatolik: " + (e?.message || ""));
    } finally {
      hide();
    }
  }, [dispatch]);

  const decline = useCallback(async (id) => {
    try {
      await cityTaxiApi.decline(id);
      dispatch({ type: "orders/setIncoming", payload: null });
      message.info("Rad etildi");
    } catch (e) {
      message.error("Rad etishda xatolik: " + (e?.message || ""));
    }
  }, [dispatch]);

  const arrived = useCallback(async () => {
    if (!state.activeOrder?.id) return;
    try {
      const r = await cityTaxiApi.updateStatus(state.activeOrder.id, TaxiOrderStatus.ARRIVED);
      dispatch({ type: "orders/updateActive", payload: { status: TaxiOrderStatus.ARRIVED } });
      message.success("Mijoz yoniga keldim");
      return r;
    } catch (e) {
      message.error("Status yangilash xatolik: " + (e?.message || ""));
    }
  }, [state.activeOrder?.id, dispatch]);

  const startTrip = useCallback(async () => {
    if (!state.activeOrder?.id) return;
    try {
      await cityTaxiApi.updateStatus(state.activeOrder.id, TaxiOrderStatus.ON_TRIP);
      dispatch({ type: "orders/updateActive", payload: { status: TaxiOrderStatus.ON_TRIP, startedAt: Date.now() } });
      message.success("Safar boshlandi");
    } catch (e) {
      message.error("Boshlashda xatolik: " + (e?.message || ""));
    }
  }, [state.activeOrder?.id, dispatch]);

  const completeTrip = useCallback(async () => {
    if (!state.activeOrder?.id) return;
    try {
      await cityTaxiApi.complete(state.activeOrder.id);
      dispatch({ type: "orders/updateActive", payload: { status: TaxiOrderStatus.COMPLETED, completedAt: Date.now() } });
      message.success("Safar yakunlandi");
    } catch (e) {
      message.error("Yakunlashda xatolik: " + (e?.message || ""));
    }
  }, [state.activeOrder?.id, dispatch]);

  const cancelOrder = useCallback(async () => {
    if (!state.activeOrder?.id) return;
    const hide = message.loading("Bekor qilinmoqda...", 0);
    try {
      await cityTaxiApi.cancel(state.activeOrder.id);
      dispatch({ type: "orders/setActive", payload: null });
      dispatch({ type: "orders/setIncoming", payload: null });
      message.success("Buyurtma bekor qilindi");
    } catch (e) {
      message.error("Bekor qilishda xatolik: " + (e?.message || ""));
    } finally {
      hide();
    }
  }, [state.activeOrder?.id, dispatch]);

  return { toggleOnline, accept, decline, arrived, startTrip, completeTrip, cancelOrder };
}

function normalizeActive(o, fallbackStatus) {
  const id = o?.id ?? o?.data?.id ?? o?.order?.id;
  const raw = o?.data ?? o?.order ?? o ?? {};
  return {
    id,
    status: raw.status || fallbackStatus,
    priceUzs: raw.priceUzs || raw.price || raw.amount || 0,
    pickup_lat: raw.pickup_lat ?? raw.from_lat,
    pickup_lng: raw.pickup_lng ?? raw.from_lng,
    dropoff_lat: raw.dropoff_lat ?? raw.to_lat,
    dropoff_lng: raw.dropoff_lng ?? raw.to_lng,
    pickup_address: raw.pickup_address ?? raw.pickup_location ?? raw.from_address ?? raw.pickupLocation ?? "",
    dropoff_address: raw.dropoff_address ?? raw.dropoff_location ?? raw.to_address ?? raw.dropoffLocation ?? "",
    customer_name: raw.customer_name ?? raw.client_name ?? "Mijoz",
    customer_phone: raw.customer_phone ?? raw.phone ?? "",
    startedAt: raw.startedAt ?? null,
  };
}
