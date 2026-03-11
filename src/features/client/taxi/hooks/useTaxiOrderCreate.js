import { useCallback, useRef } from "react";
import { message } from "antd";
import { toCreateOrderPayload, fromOrderResponse } from "../lib/taxiOrderAdapter";
import {
  extractOrder,
  extractOrderId,
  extractApiError,
  isApiOk,
} from "../../../../utils/apiResponse";
import { postJson } from "../../../../utils/apiHelper";

const ORDER_ENDPOINT = "/api/order";

async function createOrderRequest(payload) {
  return postJson(ORDER_ENDPOINT, payload);
}

export function useTaxiOrderCreate(options = {}) {
  const {
    cp,
    pickup,
    dest,
    tariff,
    totalPrice,
    distanceKm,
    waypoints,
    orderFor,
    otherPhone,
    wishes,
    comment,
    scheduledTime,
    setOrderId,
    setOrderStatus,
    setStep,
    speak,
  } = options;

  const creatingRef = useRef(false);

  const handleOrderCreate = useCallback(async () => {
    if (creatingRef.current) return;

    const draft = {
      pickup,
      dropoff: dest?.latlng
        ? {
            lat: dest.latlng[0],
            lng: dest.latlng[1],
            address: dest.address || "",
          }
        : null,
      payment_method: "cash",
      car_type: tariff?.id || "start",
      comment: comment || "",
      price_uzs: totalPrice || null,
      distance_m: distanceKm ? Math.round(distanceKm * 1000) : null,
      duration_s: null,
      options: {
        waypoints: Array.isArray(waypoints) ? waypoints : [],
        orderFor: orderFor || "self",
        otherPhone: otherPhone || "",
        wishes: wishes || {},
        scheduledTime: scheduledTime || null,
      },
    };

    const payload = toCreateOrderPayload(draft);

    if (
      !payload.pickup ||
      payload.pickup.lat == null ||
      payload.pickup.lng == null
    ) {
      message.error(cp ? cp("Olish joyini tanlang") : "Olish joyini tanlang");
      return {
        ok: false,
        error: "pickup_required",
        order: null,
        orderId: null,
      };
    }

    creatingRef.current = true;

    try {
      const response = await createOrderRequest(payload);
      const ok = isApiOk(response);
      const apiError = extractApiError(response);

      if (!ok) {
        message.error(
          apiError ||
            (cp ? cp("Zakaz berishda xatolik") : "Zakaz berishda xatolik")
        );

        return {
          ok: false,
          error: apiError || "order_create_failed",
          order: null,
          orderId: null,
          response,
        };
      }

      const rawOrder = extractOrder(response) ?? response?.order ?? null;
      const normalizedOrder = fromOrderResponse(rawOrder);
      const orderId = extractOrderId(response) ?? normalizedOrder?.id ?? null;

      if (!orderId) {
        message.error(
          cp ? cp("Serverdan order ID kelmadi") : "Serverdan order ID kelmadi"
        );

        return {
          ok: false,
          error: "missing_order_id",
          order: null,
          orderId: null,
          response,
        };
      }

      if (typeof setOrderId === "function") {
        setOrderId(orderId);
      }

      if (typeof setOrderStatus === "function") {
        setOrderStatus(normalizedOrder?.status || "searching");
      }

      if (typeof setStep === "function") {
        setStep("searching");
      }

      if (typeof speak === "function") {
        try {
          speak(cp ? cp("Haydovchi qidirilmoqda") : "Haydovchi qidirilmoqda");
        } catch (_) {}
      }

      return {
        ok: true,
        error: "",
        order: normalizedOrder,
        orderId,
        response,
      };
    } catch (error) {
      const errorMessage =
        error?.message ||
        (cp ? cp("Zakaz berishda xatolik") : "Zakaz berishda xatolik");

      message.error(errorMessage);

      return {
        ok: false,
        error: errorMessage,
        order: null,
        orderId: null,
      };
    } finally {
      creatingRef.current = false;
    }
  }, [
    cp,
    pickup,
    dest,
    tariff,
    totalPrice,
    distanceKm,
    waypoints,
    orderFor,
    otherPhone,
    wishes,
    comment,
    scheduledTime,
    setOrderId,
    setOrderStatus,
    setStep,
    speak,
  ]);

  return handleOrderCreate;
}

export default useTaxiOrderCreate;
