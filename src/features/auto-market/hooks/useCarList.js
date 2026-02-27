import { useCallback, useEffect, useMemo, useState } from "react";
import { listCars } from "../services/marketApi";

export default function useCarList(filters, options = {}) {
  const pageSize = options.pageSize ?? 12;
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (p = page) => {
    setLoading(true);
    setError("");
    try {
      const res = await listCars(filters, { page: p, pageSize });
      setItems(res.items);
      setTotal(res.total);
      setPage(res.page);
    } catch (e) {
      setError(e?.message || "Xatolik");
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize]);

  useEffect(() => { load(1); }, [load]);

  const pageCount = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  return { items, total, page, pageSize, pageCount, loading, error, reload: () => load(1), go: (p)=>load(p) };
}
