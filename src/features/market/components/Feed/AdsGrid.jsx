
import React, { useEffect, useRef } from "react";
import AdCard from "./AdCard";

export default function AdsGrid({ items = [], onEndReached, loading }) {
  const sentinelRef = useRef(null);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;
    const obs = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) onEndReached?.();
    }, { rootMargin: "200px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [onEndReached]);

  return (
    <div style={{ padding: "0 12px 24px" }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: 12
      }}>
        {items.map((ad) => <AdCard key={ad.id} ad={ad} />)}
      </div>

      <div ref={sentinelRef} style={{ height: 1 }} />
      {loading ? <div style={{ padding: 12, opacity: 0.7, textAlign: "center" }}>Yuklanmoqda...</div> : null}
    </div>
  );
}
