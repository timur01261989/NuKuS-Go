import { useCallback } from "react";
import clientOrderService from "../services/clientOrderService.js";

export default function useCreateOrder() {
  return useCallback(async (payload) => clientOrderService.createOrder(payload), []);
}
