
import React from "react";
import BackNavLayout from "../layouts/BackNavLayout";
import SearchBar from "../components/Common/SearchBar";
import AdsGrid from "../components/Feed/AdsGrid";
import useMarketAds from "../hooks/useMarketAds";
import { useMarketFilters } from "../context/MarketFilterContext";
import EmptyState from "../components/Common/EmptyState";
import LoadingSkeleton from "../components/Common/LoadingSkeleton";

export default function MarketSearch() {
  const { filters } = useMarketFilters();
  const { items, loading, done, loadMore } = useMarketAds(filters, 12);

  return (
    <BackNavLayout title="Qidiruv">
      <SearchBar placeholder="Qidirish..." />
      {loading && items.length === 0 ? <LoadingSkeleton /> : null}
      {!loading && items.length === 0 ? <EmptyState /> : null}
      {items.length ? <AdsGrid items={items} onEndReached={() => !done && loadMore()} loading={loading} /> : null}
    </BackNavLayout>
  );
}
