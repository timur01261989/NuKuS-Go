import { useCallback, useMemo } from "react";
import walletService from "../services/walletService.js";

export default function useWallet() {
  const getBalance = useCallback((userId) => walletService.getWalletBalance(userId), []);
  const topUp = useCallback((payload) => walletService.topUpWallet(payload), []);
  const applyPromo = useCallback((payload) => walletService.applyPromoCode(payload), []);

  return useMemo(
    () => ({
      getBalance,
      topUp,
      applyPromo,
    }),
    [applyPromo, getBalance, topUp],
  );
}
