
import React, { useMemo, useState } from "react";
import MarketLayout from "../layouts/MarketLayout";
import MarketHeader from "../components/Common/MarketHeader";
import MyAdsTabs from "../components/MyAds/MyAdsTabs";
import MyAdCard from "../components/MyAds/MyAdCard";
import EmptyMyAds from "../components/MyAds/EmptyMyAds";
import { getMyAds } from "../services/marketApi";

export default function MyAds() {
  const [tab, setTab] = useState("active");
  const items = getMyAds();

  const visible = useMemo(() => {
    // demo: all ads are active
    return tab === "active" ? items : [];
  }, [items, tab]);

  return (
    <MarketLayout>
      <MarketHeader title="E'lonlarim" />
      <MyAdsTabs value={tab} onChange={setTab} />

      <div style={{ padding: "0 12px 24px", display: "grid", gap: 12 }}>
        {visible.length ? visible.map((ad) => <MyAdCard key={ad.id} ad={ad} />) : <EmptyMyAds />}
      </div>
    </MarketLayout>
  );
}
