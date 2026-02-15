
import { useCallback, useMemo, useState } from "react";

export default function useComparison(max = 3) {
  const [ids, setIds] = useState([]);

  const toggle = useCallback((id) => {
    const sid = String(id);
    setIds((prev) => {
      if (prev.includes(sid)) return prev.filter((x) => x !== sid);
      if (prev.length >= max) return prev; // limit
      return [...prev, sid];
    });
  }, [max]);

  const clear = useCallback(() => setIds([]), []);
  const state = useMemo(() => ({ ids, count: ids.length, max }), [ids, max]);
  return { ...state, toggle, clear };
}
