import { useCallback, useMemo } from "react";
import paymentService from "../services/paymentService";

export default function useWallet() {
  const getBalance = useCallback((userId) => {
    if (typeof paymentService.getWalletBalance === "function") {
      return paymentService.getWalletBalance(userId);
    }
    return Promise.resolve(null);
  }, []);

  return useMemo(() => ({ getBalance }), [getBalance]);
}
