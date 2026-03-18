import taxiLogger from "../../../../../shared/taxi/utils/taxiLogger";

/**
 * Driver tracker (polling). Replace with Supabase realtime later.
 */
export function startDriverPolling({ getDriver, intervalMs = 2500, onUpdate }) {
  let timer = null;
  let stopped = false;

  const tick = async () => {
    if (stopped) return;
    try {
      const d = await getDriver?.();
      if (d) onUpdate?.(d);
    } catch (error) {
      taxiLogger.warn("client.taxi.driver_tracker.tick_failed", { error });
    }
    if (!stopped) timer = setTimeout(tick, intervalMs);
  };

  timer = setTimeout(tick, intervalMs);

  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
  };
}
