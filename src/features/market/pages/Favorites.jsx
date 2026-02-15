
import React from "react";
import MarketLayout from "../layouts/MarketLayout";
import MarketHeader from "../components/Common/MarketHeader";
import AdsGrid from "../components/Feed/AdsGrid";
import EmptyState from "../components/Common/EmptyState";
import { getFavorites } from "../services/marketApi";

export default function Favorites() {
  const items = getFavorites();
  return (
    <MarketLayout>
      <MarketHeader title="Saqlanganlar" />
      {items.length ? <AdsGrid items={items} /> : <EmptyState title="Saqlangan e'lonlar yo'q" />}
    </MarketLayout>
  );
}
