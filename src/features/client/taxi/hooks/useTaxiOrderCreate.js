import { useCallback, useMemo, useState } from "react";
import { toCreateOrderPayload, fromOrderResponse } from "../lib/taxiOrderAdapter";
import { extractOrder, extractOrderId, extractApiError, isApiOk } from "../../../../utils/apiResponse";
import { postJson } from "../../../../utils/apiHelper";

const ORDER_ENDPOINT = "/api/order";

async function createOrderRequest(payload) {
  return postJson(ORDER_ENDPOINT, payload);
}

export function useTaxiOrderCreate(options = {}) {
  const {
    onCreated,
    onError,
  } = options;

  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const createOrder = useCallback(
    async (draft) => {
      const payload = toCreateOrderPayload(draft);

      if (!payload.pickup || payload.pickup.lat == null || payload.pickup.lng == null) {
        const errorMessage = "Pickup tanlanishi kerak";
        setCreateError(errorMessage);
        if (typeof onError === "function") onError(errorMessage);
        return {
          ok: false,
          error: errorMessage,
          order: null,
          orderId: null,
        };
      }

      setIsCreating(true);
      setCreateError("");

      try {
        const response = await createOrderRequest(payload);
        const ok = isApiOk(response);
        const errorMessage = extractApiError(response);

        if (!ok && errorMessage) {
          setCreateError(errorMessage);
          if (typeof onError === "function") onError(errorMessage);
          return {
            ok: false,
            error: errorMessage,
            order: null,
            orderId: null,
          };
        }

        const rawOrder = extractOrder(response) ?? response?.order ?? null;
        const normalizedOrder = fromOrderResponse(rawOrder);
        const orderId = extractOrderId(response) ?? normalizedOrder?.id ?? null;

        if (!orderId) {
          const idError = "Serverdan order id qaytmadi";
          setCreateError(idError);
          if (typeof onError === "function") onError(idError);
          return {
            ok: false,
            error: idError,
            order: null,
            orderId: null,
          };
        }

        const successResult = {
          ok: true,
          error: "",
          order: normalizedOrder,
          orderId,
          response,
        };

        if (typeof onCreated === "function") {
          onCreated(successResult);
        }

        return successResult;
      } catch (error) {
        const message = error?.message || "Order yaratishda xatolik";
        setCreateError(message);
        if (typeof onError === "function") onError(message);

        return {
          ok: false,
          error: message,
          order: null,
          orderId: null,
        };
      } finally {
        setIsCreating(false);
      }
    },
    [onCreated, onError]
  );

  return useMemo(
    () => ({
      createOrder,
      isCreating,
      createError,
      setCreateError,
    }),
    [createOrder, isCreating, createError]
  );
}

export default useTaxiOrderCreate;
