import { useCallback, useEffect, useMemo, useState } from "react";

const LS_KEY = "auto_market_recent_v1";
const MAX = 30;

function load() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch { return []; }
}
function save(v) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(v)); } catch {}
}

export default function useRecentlyViewed() {
  const [ids, setIds] = useState(load());

  useEffect(() => { save(ids); }, [ids]);

  const push = useCallback((id) => {
    setIds((prev) => {
      const next = [String(id), ...prev.filter(x => x !== String(id))].slice(0, MAX);
      return next;
    });
  }, []);

  const clear = useCallback(()=>setIds([]), []);

  return { ids, push, clear };
}
