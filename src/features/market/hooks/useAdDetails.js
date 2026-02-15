
import { useEffect, useState } from "react";
import { getAdDetails } from "../services/marketApi";

export default function useAdDetails(adId) {
  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!adId) return;
    let cancelled = false;
    setLoading(true);
    getAdDetails(adId)
      .then((x) => { if (!cancelled) setAd(x); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [adId]);

  return { ad, loading };
}
