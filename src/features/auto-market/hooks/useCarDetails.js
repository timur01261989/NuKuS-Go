import { useEffect, useState } from "react";
import { getCarById, priceHistory } from "../services/marketApi";

export default function useCarDetails(id) {
  const [car, setCar] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true); setError("");
      try {
        const c = await getCarById(id);
        const h = await priceHistory(id);
        if (!mounted) return;
        setCar(c);
        setHistory(h);
      } catch (e) {
        if (!mounted) return;
        setError(e?.message || "Xatolik");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  return { car, history, loading, error };
}
