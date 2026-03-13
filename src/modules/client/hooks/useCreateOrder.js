import { useCallback } from "react";
import orderService from "../services/orderService";

export default function useCreateOrder() {
  return useCallback(async (payload) => {
    if (typeof orderService.createOrder === "function") {
      return orderService.createOrder(payload);
    }
    throw new Error("createOrder function is not available");
  }, []);
}
