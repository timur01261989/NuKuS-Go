import { useEffect } from "react";
import taxiClientApi from "@/modules/shared/taxi/api/taxiClientApi.js";
import {
  TAXI_STATUS,
  getTaxiPollingInterval,
  getTaxiUiStepFromStatus,
  isTaxiCompleted,
  normalizeTaxiStatus,
} from "@/modules/shared/taxi/constants/taxiStatuses.js";
import { taxiLogger } from "@/modules/shared/taxi/utils/taxiLogger.js";
import { haversineKm } from "../../shared/geo/haversine";

function mapDriverPayload(driver) {
  if (!driver) return null;
  return {
    first_name: driver.first_name || driver.name || "Haydovchi",
    avatar_url: driver.avatar_url || driver.avatar || "",
    car_model: driver.car_model || driver.car || "",
    plate: driver.plate || driver.car_plate || "",
    lat: Number(driver.lat ?? driver.driver_lat ?? driver.latitude),
    lng: Number(driver.lng ?? driver.driver_lng ?? driver.longitude),
    bearing: Number(driver.bearing ?? driver.heading ?? 0),
    rating: Number(driver.rating ?? 4.8),
    phone: driver.phone || "",
  };
}

export function useRestoreActiveOrder({ setOrderId, setOrderStatus, setPickup, setDest, setStep }) {
  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const saved = localStorage.getItem("activeOrderId");
        if (saved) setOrderId(saved);

        const order = await taxiClientApi.getActiveOrder();
        if (!mounted || !order?.id) return;

        const normalizedStatus = normalizeTaxiStatus(order.status || order.order_status);
        setOrderId(String(order.id));
        localStorage.setItem("activeOrderId", String(order.id));
        setOrderStatus(normalizedStatus);
        setPickup((prev) => ({
          ...prev,
          latlng: order.from_lat && order.from_lng ? [Number(order.from_lat), Number(order.from_lng)] : prev.latlng,
          address: order.pickup_location || prev.address,
        }));
        if (order.to_lat && order.to_lng) {
          setDest({ latlng: [Number(order.to_lat), Number(order.to_lng)], address: order.dropoff_location || "" });
        }
        setStep(getTaxiUiStepFromStatus(normalizedStatus));
      } catch (error) {
        taxiLogger.warn("Active taxi buyurtmani tiklashda xatolik", {
          error: error?.message || String(error),
        });
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [setOrderId, setOrderStatus, setPickup, setDest, setStep]);
}

export function useOrderStatusPolling({
  orderId,
  pickup,
  orderStatus,
  step,
  setOrderStatus,
  setAssignedDriver,
  setCompletedOrderForRating,
  setRatingVisible,
  setEarnedBonus,
  setEtaMin,
  setEtaUpdatedAt,
  cp,
  speak,
}) {
  useEffect(() => {
    if (!orderId) return;
    let timer = null;
    let alive = true;

    const tick = async () => {
      try {
        const order = await taxiClientApi.getOrder(orderId);
        if (!alive || !order) return;

        const normalizedStatus = normalizeTaxiStatus(order.status || order.order_status, TAXI_STATUS.SEARCHING);

        if (normalizedStatus !== orderStatus) {
          setOrderStatus(normalizedStatus);
          if (normalizedStatus === TAXI_STATUS.ACCEPTED) speak(cp("Haydovchi topildi"));
          if (normalizedStatus === TAXI_STATUS.ARRIVED) speak(cp("Haydovchi yetib keldi"));
          if (isTaxiCompleted(normalizedStatus)) {
            speak(cp("Safar yakunlandi. Rahmat!"));
            const drvId = order?.driver?.id || order?.driver_id || order?.assigned_driver_id || null;
            const userId = order?.user_id || null;
            setCompletedOrderForRating({ id: orderId, driver_id: drvId, user_id: userId });
            setRatingVisible(true);
            const price = Number(order?.price || order?.amount || order?.priceUzs || 0);
            setEarnedBonus(Math.max(1, Math.floor(price * 0.01)));
          }
        }

        const driver = mapDriverPayload(order?.driver || order?.assigned_driver || order?.assignedDriver);
        if (driver) {
          setAssignedDriver(driver);
          if (Number.isFinite(driver.lat) && Number.isFinite(driver.lng) && pickup.latlng) {
            const distance = haversineKm([driver.lat, driver.lng], pickup.latlng);
            setEtaMin(Math.max(1, Math.round(distance * 3)));
            setEtaUpdatedAt(Date.now());
          }
        }
      } catch (error) {
        taxiLogger.warn("Taxi status polling xatolik", {
          orderId,
          error: error?.message || String(error),
        });
      }
    };

    const loop = async () => {
      if (!alive) return;
      await tick();
      if (!alive) return;
      timer = setTimeout(loop, getTaxiPollingInterval(orderStatus, step));
    };

    loop();
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
  }, [
    orderId,
    pickup.latlng?.[0],
    pickup.latlng?.[1],
    orderStatus,
    step,
    setOrderStatus,
    setAssignedDriver,
    setCompletedOrderForRating,
    setRatingVisible,
    setEarnedBonus,
    setEtaMin,
    setEtaUpdatedAt,
    cp,
    speak,
  ]);
}
