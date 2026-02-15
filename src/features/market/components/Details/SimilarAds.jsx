
import React from "react";
import AdsGrid from "../Feed/AdsGrid";

export default function SimilarAds({ items = [] }) {
  if (!items?.length) return null;
  return (
    <div>
      <div style={{ padding: "0 12px 10px", fontWeight: 800 }}>O'xshash e'lonlar</div>
      <AdsGrid items={items.slice(0, 4)} />
    </div>
  );
}
