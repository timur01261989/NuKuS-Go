import { useEffect } from "react";
import api from "@/utils/apiHelper";
import { haversineKm } from "../../shared/geo/haversine";

export function useRestoreActiveOrder({ setOrderId, setOrderStatus, setPickup, setDest, setStep }) {
  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const saved = localStorage.getItem("activeOrderId");
        if (saved) setOrderId(saved);

        const res = await api.post("/api/order", { action: "active" });
        const o = res?.data || res;
        if (!mounted) return;
        if (o?.id) {
          setOrderId(String(o.id));
          localStorage.setItem("activeOrderId", String(o.id));
          setOrderStatus(o.status || o.order_status || "searching");
          setPickup((p) => ({
            ...p,
            latlng: o.from_lat && o.from_lng ? [Number(o.from_lat), Number(o.from_lng)] : p.latlng,
            address: o.pickup_location || p.address,
          }));
          if (o.to_lat && o.to_lng) {
            setDest({ latlng: [Number(o.to_lat), Number(o.to_lng)], address: o.dropoff_location || "" });
          }
          if (o.status === "accepted" || o.status === "coming" || o.status === "arrived") {
            setStep("coming");
          } else if (o.status === "searching") {
            setStep("searching");
          } else {
            setStep("main");
          }
        }
      } catch {}
    };
    run();
    return () => {
      mounted = false;
    };
  }, [setOrderId, setOrderStatus, setPickup, setDest, setStep]);
}

export function useOrderStatusPolling({ orderId, pickup, orderStatus, step, assignedDriver, setOrderStatus, setAssignedDriver, setCompletedOrderForRating, setRatingVisible, setEarnedBonus, setEtaMin, cp, speak }) {
  useEffect(() => {
    if (!orderId) return;
    let timer = null;
    let alive = true;

    const tick = async () => {
      try {
        const res = await api.post("/api/order", { action: "get", order_id: orderId });
        if (!alive) return;
        const o = res?.data || res;
        const st = o?.status || o?.order_status;
        if (st && st !== orderStatus) {
          setOrderStatus(st);
          if (st === "accepted") speak(cp("Haydovchi topildi"));
          if (st === "arrived") speak(cp("Haydovchi yetib keldi"));
          if (st === "completed" || st === "done") {
            speak(cp("Safar yakunlandi. Rahmat!"));
            const drvId = o?.driver?.id || o?.driver_id || o?.assigned_driver_id || null;
            const userId = o?.user_id || null;
            setCompletedOrderForRating({ id: orderId, driver_id: drvId, user_id: userId });
            setRatingVisible(true);
            const price = Number(o?.price || o?.amount || o?.priceUzs || 0);
            setEarnedBonus(Math.max(1, Math.floor(price * 0.01)));
          }
        }

        const drv = o?.driver || o?.assigned_driver || o?.assignedDriver;
        if (drv) {
          setAssignedDriver({
            first_name: drv.first_name || drv.name || "Haydovchi",
            avatar_url: drv.avatar_url || drv.avatar || "",
            car_model: drv.car_model || drv.car || "",
            plate: drv.plate || drv.car_plate || "",
            lat: Number(drv.lat ?? drv.driver_lat ?? drv.latitude),
            lng: Number(drv.lng ?? drv.driver_lng ?? drv.longitude),
            bearing: Number(drv.bearing ?? drv.heading ?? 0),
            rating: Number(drv.rating ?? 4.8),
            phone: drv.phone || "",
          });
        }

        if (assignedDriver?.lat && assignedDriver?.lng && pickup.latlng) {
          const d = haversineKm([assignedDriver.lat, assignedDriver.lng], pickup.latlng);
          setEtaMin(Math.max(1, Math.round(d * 3)));
        }
      } catch {}
    };

    tick();
    const nextInterval = () => {
      if (step === "searching" || orderStatus === "searching") return 2000;
      if (orderStatus === "accepted" || orderStatus === "coming" || orderStatus === "arrived") return 3500;
      if (orderStatus === "ontrip" || orderStatus === "in_trip") return 8000;
      return 4000;
    };

    let stopped = false;
    const loop = async () => {
      if (stopped) return;
      await tick();
      if (stopped) return;
      timer = setTimeout(loop, nextInterval());
    };

    loop();
    return () => {
      alive = false;
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }, [orderId, pickup.latlng?.[0], pickup.latlng?.[1], orderStatus, step, assignedDriver, setOrderStatus, setAssignedDriver, setCompletedOrderForRating, setRatingVisible, setEarnedBonus, setEtaMin, cp, speak]);
}
