import { useCallback } from "react";
import { message } from "antd";
import api from "@/utils/apiHelper";
import { haversineKm } from "../../shared/geo/haversine";
const MAX_KM = 50;

export function useTaxiOrderCreate(params) {
  const { cp, pickup, dest, tariff, totalPrice, distanceKm, waypoints, orderFor, otherPhone, wishes, comment, scheduledTime, setOrderId, setOrderStatus, setStep, speak } = params;

  return useCallback(async () => {
    if (!pickup.latlng) {
      message.error(cp("Yo'lovchini olish nuqtasi aniqlanmadi"));
      return;
    }

    if (dest.latlng) {
      const d = distanceKm || haversineKm(pickup.latlng, dest.latlng);
      if (d > MAX_KM) {
        message.error(`Masofa belgilangan me'yoridan ortiq (${MAX_KM} km)`);
        return;
      }
    }

    const hide = message.loading(cp("Buyurtma yuborilmoqda..."), 0);
    try {
      const payloadBase = {
        status: "searching",
        price: Math.round(totalPrice),
        use_server_pricing: true,
        service_type: "taxi",
        tariff_id: tariff.id,
        pickup_location: pickup.address || cp("Yo'lovchini olish nuqtasi"),
        dropoff_location: dest.address || "",
        from_lat: pickup.latlng[0],
        from_lng: pickup.latlng[1],
        to_lat: dest.latlng ? dest.latlng[0] : null,
        to_lng: dest.latlng ? dest.latlng[1] : null,
        distance_km: dest.latlng ? (distanceKm || haversineKm(pickup.latlng, dest.latlng)) : 0,
        duration_min: dest.latlng ? Math.max(1, Math.round(((distanceKm || haversineKm(pickup.latlng, dest.latlng)) || 0) * 2)) : 0,
        waypoints: waypoints.map((w) => ({
          lat: w.latlng?.[0],
          lng: w.latlng?.[1],
          address: w.address || "",
        })),
        pickup_entrance: pickup.entrance || "",
        order_for: orderFor,
        other_phone: orderFor === "other" ? (otherPhone || "") : "",
        wishes,
        comment: comment || "",
        scheduled_time: scheduledTime,
      };

      const actions = ["create", "create_taxi", "create_city", "new"];
      let res = null;
      let lastErr = null;
      for (const action of actions) {
        try {
          res = await api.post("/api/order", { action, ...payloadBase });
          if (res?.data || res?.id || res?.orderId) break;
        } catch (e) {
          lastErr = e;
        }
      }

      const id = res?.data?.id || res?.id || res?.orderId;
      if (!id) throw lastErr || new Error(cp("Serverdan ID kelmadi"));

      setOrderId(String(id));
      localStorage.setItem("activeOrderId", String(id));
      setOrderStatus("searching");
      setStep("searching");
      speak(cp("Haydovchi qidirilmoqda"));
      message.success(cp("Buyurtma yuborildi"));
    } catch (e) {
      console.error("Order error:", e);
      message.error("Zakaz berishda xatolik: " + (e?.message || cp("Server bilan aloqa yo'q")));
    } finally {
      hide();
    }
  }, [cp, pickup, dest, tariff, totalPrice, distanceKm, waypoints, orderFor, otherPhone, wishes, comment, scheduledTime, setOrderId, setOrderStatus, setStep, speak]);
}
