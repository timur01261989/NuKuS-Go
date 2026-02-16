import React, { useMemo } from "react";
import { useMarket } from "../context/MarketContext";
import { useMarketStore } from "../stores/marketStore";
import CarSkeleton from "../components/Feed/CarSkeleton";
import CarCardVertical from "../components/Feed/CarCardVertical";
import StoriesRail from "../components/Feed/StoriesRail";
import CompareFloatBtn from "../components/Feed/CompareFloatBtn";

export default function FeedPage() {
  const { cars, loading, error, loadMore, hasMore } = useMarket();
  const { filters, setFilters } = useMarketStore();

  const topCars = useMemo(() => cars.filter((c) => c.is_top || c.status === "top"), [cars]);

  return (
    <div style={{ padding: 16, maxWidth: 980, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 20, fontWeight: 900 }}>Avto Bozor</div>
        <input
          value={filters.q || ""}
          onChange={(e) => setFilters({ q: e.target.value })}
          placeholder="Qidirish..."
          style={{ width: 280, padding: 10, borderRadius: 12, border: "1px solid rgba(0,0,0,0.14)" }}
        />
      </div>

      <StoriesRail items={topCars} />

      {error ? (
        <div style={{ padding: 14, background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 14 }}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>Xatolik</div>
          <div style={{ opacity: 0.75 }}>{String(error.message || error)}</div>
        </div>
      ) : loading && cars.length === 0 ? (
        <CarSkeleton count={6} />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
          {cars.map((c) => (
            <CarCardVertical key={c.id} car={c} />
          ))}
        </div>
      )}

      <div style={{ textAlign: "center", marginTop: 14 }}>
        {hasMore ? (
          <button
            onClick={loadMore}
            disabled={loading}
            style={{ border: "none", background: "#111827", color: "#fff", padding: "10px 14px", borderRadius: 12, fontWeight: 900, cursor: "pointer" }}
          >
            {loading ? "Yuklanmoqda..." : "Yana ko'rsatish"}
          </button>
        ) : (
          <div style={{ opacity: 0.7 }}>Boshqa e'lon yo'q</div>
        )}
      </div>

      <CompareFloatBtn />
    </div>
  );
}
