
import { useCallback, useMemo } from "react";

const KEY = "market_recent_v1";

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function save(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch {} }

export default function useRecentlyViewed(limit = 20) {
  const list = useMemo(() => load().slice(0, limit), [limit]);

  const push = useCallback((ad) => {
    if (!ad?.id) return;
    const curr = load().filter((x) => String(x.id) !== String(ad.id));
    curr.unshift({ id: String(ad.id), title: ad.title, photo: ad.photos?.[0] || "", price: ad.price, currency: ad.currency });
    save(curr.slice(0, limit));
  }, [limit]);

  return { list, push };
}
