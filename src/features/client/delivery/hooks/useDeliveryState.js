import { useCallback, useMemo, useState } from "react";

export function useDeliveryState() {
  const [step, setStep] = useState("setup"); // setup | searching | active
  const [status, setStatus] = useState(""); // searching | pickup | delivering | completed | cancelled

  const goSetup = useCallback(() => setStep("setup"), []);
  const goSearching = useCallback(() => setStep("searching"), []);
  const goActive = useCallback(() => setStep("active"), []);

  const timelineItems = useMemo(() => {
    const order = ["searching", "pickup", "delivering", "completed"];
    const idx = order.indexOf(status);
    return order.map((s, i) => ({ key: s, title: s, done: idx >= i && idx !== -1 }));
  }, [status]);

  return {
    step,
    setStep,
    status,
    setStatus,
    goSetup,
    goSearching,
    goActive,
    timelineItems,
  };
}
