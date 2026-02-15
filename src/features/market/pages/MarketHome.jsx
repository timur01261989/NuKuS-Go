
import React, { useState } from "react";
import { Button } from "antd";
import MarketLayout from "../layouts/MarketLayout";
import SearchBar from "../components/Common/SearchBar";
import TopPromo from "../components/Feed/TopPromo";
import CategoriesRow from "../components/Feed/CategoriesRow";
import SortChips from "../components/Filters/SortChips";
import FilterButton from "../components/Filters/FilterButton";
import FiltersDrawer from "../components/Filters/FiltersDrawer";
import AdsGrid from "../components/Feed/AdsGrid";
import LoadingSkeleton from "../components/Common/LoadingSkeleton";
import EmptyState from "../components/Common/EmptyState";
import useMarketAds from "../hooks/useMarketAds";
import { useMarketFilters } from "../context/MarketFilterContext";

export default function MarketHome() {
  const { filters } = useMarketFilters();
  const { items, loading, done, loadMore } = useMarketAds(filters, 12);
  const [open, setOpen] = useState(false);

  return (
    <MarketLayout>
      <div style={{
        position: "sticky", top: 0, zIndex: 30,
        background: "#fafafa"
      }}>
        <SearchBar placeholder="Mashina, model, yil..." />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 12px 10px" }}>
          <div style={{ fontWeight: 900 }}>E'lonlar</div>
          <div style={{ display: "flex", gap: 8 }}>
            <FilterButton onClick={() => setOpen(true)} />
            <Button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} style={{ borderRadius: 12 }}>
              Tepaga
            </Button>
          </div>
        </div>
        <SortChips />
      </div>

      <TopPromo />
      <CategoriesRow onSelect={() => setOpen(true)} />

      {loading && items.length === 0 ? <LoadingSkeleton /> : null}
      {!loading && items.length === 0 ? <EmptyState /> : null}
      {items.length ? <AdsGrid items={items} onEndReached={() => !done && loadMore()} loading={loading} /> : null}

      <FiltersDrawer open={open} onClose={() => setOpen(false)} />
    </MarketLayout>
  );
}
