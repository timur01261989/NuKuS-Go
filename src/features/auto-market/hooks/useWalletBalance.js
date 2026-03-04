import React from "react";
import { getWalletBalance } from "../services/marketBackend";

export default function useWalletBalance({ refreshMs = 0 } = {}) {
  const [balance, setBalance] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const b = await getWalletBalance();
      setBalance(Number(b || 0));
    } catch (e) {
      setError(e?.message || "Wallet xatosi");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    if (!refreshMs) return;
    const t = setInterval(load, refreshMs);
    return () => clearInterval(t);
  }, [refreshMs, load]);

  return { balance, loading, error, refresh: load };
}
