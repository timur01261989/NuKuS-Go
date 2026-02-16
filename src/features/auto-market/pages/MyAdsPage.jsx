import React, { useEffect, useState } from "react";
import { useMarket } from "../context/MarketContext";

export default function MyAdsPage() {
  const { fetchMyAds } = useMarket();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetchMyAds();
        if (!alive) return;
        setItems(res || []);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [fetchMyAds]);

  return (
    <div style={{ padding: 16, maxWidth: 980, margin: "0 auto" }}>
      <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 12 }}>Mening e'lonlarim</div>
      {loading ? <div>Yuklanmoqda...</div> : <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(items, null, 2)}</pre>}
    </div>
  );
}
