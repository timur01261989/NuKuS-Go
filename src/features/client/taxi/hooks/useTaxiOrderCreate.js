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
import { supabase } from "@/lib/supabase";

const ORDER_ENDPOINT = "/api/order";

async function createOrderRequest(payload) {
  return postJson(ORDER_ENDPOINT, payload);
}

function readNestedUuidCandidate(source) {
  if (!source || typeof source !== "object") return null;

  const directCandidates = [
    source.id,
    source.user_id,
    source.userId,
    source.uid,
    source.sub,
  ];

  for (const candidate of directCandidates) {
    if (candidate != null && String(candidate).trim()) {
      return String(candidate).trim();
    }
  }

  const nestedKeys = ["user", "session", "profile", "currentUser", "auth"];
  for (const key of nestedKeys) {
    const nested = source[key];
    if (nested && typeof nested === "object") {
      const nestedResult = readNestedUuidCandidate(nested);
      if (nestedResult) return nestedResult;
    }
  }

  return null;
}

function tryParseJson(raw) {
  if (typeof raw !== "string" || !raw.trim()) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function resolveUserIdFromStorage() {
  if (typeof window === "undefined") return null;

  const directStorageKeys = [
    "user_id",
    "userId",
    "uid",
    "auth_user_id",
    "supabase.auth.user.id",
  ];

  for (const key of directStorageKeys) {
    const localValue = window.localStorage?.getItem?.(key);
    if (localValue && String(localValue).trim()) {
      return String(localValue).trim();
    }

    const sessionValue = window.sessionStorage?.getItem?.(key);
    if (sessionValue && String(sessionValue).trim()) {
      return String(sessionValue).trim();
    }
  }

  const storageCollections = [window.localStorage, window.sessionStorage].filter(Boolean);

  for (const storage of storageCollections) {
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (!key) continue;

      const raw = storage.getItem(key);
      if (!raw) continue;

      const parsed = tryParseJson(raw);
      if (!parsed) continue;

      const resolved = readNestedUuidCandidate(parsed);
      if (resolved) return resolved;
    }
  }

  return null;
}

export function useTaxiOrderCreate(options = {}) {
  const {
    cp,
    userId,
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

    let resolvedUserId = userId || null;

    if (!resolvedUserId) {
      try {
        const { data } = await supabase.auth.getUser();
        resolvedUserId = data?.user?.id || null;
      } catch {
        resolvedUserId = null;
      }
    }

    if (!resolvedUserId) {
      resolvedUserId = resolveUserIdFromStorage();
    }

    if (!resolvedUserId) {
      message.error(
        cp
          ? cp("Foydalanuvchi ID topilmadi. Qayta login qiling")
          : "Foydalanuvchi ID topilmadi. Qayta login qiling"
      );

      return {
        ok: false,
        error: "missing_user_id",
        order: null,
        orderId: null,
      };
    }

    const draft = {
      user_id: resolvedUserId,
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
      passenger_count: 1,
      options: {
        waypoints: Array.isArray(waypoints) ? waypoints : [],
        orderFor: orderFor || "self",
        otherPhone: otherPhone || "",
        wishes: wishes || {},
        scheduledTime: scheduledTime || null,
        tariffId: tariff?.id || "start",
        tariffTitle: tariff?.title || "Start",
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
    userId,
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
