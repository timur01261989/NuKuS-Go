
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve("/mnt/data/batch73_work");

test("extended asset additions exist", () => {
  const files = [
    "src/assets/auto-market/extended/signals/body-overview-1.png",
    "src/assets/auto-market/extended/signals/body-overview-2.png",
    "src/assets/auto-market/extended/signals/body-overview-3.png",
    "src/assets/auto-market/extended/states/state-call-cta.png",
    "src/assets/auto-market/extended/states/state-contact-cta.png",
    "src/assets/auto-market/extended/inspection/inspection-icon.png",
    "src/assets/auto-market/extended/signals/signal-price-allow-down.png",
    "src/assets/auto-market/extended/signals/signal-price-allow-up.png",
    "src/assets/auto-market/extended/signals/signal-ev-market.webp",
    "src/assets/auto-market/extended/signals/filter-search-market.png"
  ];
  for (const rel of files) assert.equal(fs.existsSync(path.join(root, rel)), true, rel);
});

test("extended signals service exposes new builders", () => {
  const text = fs.readFileSync(path.join(root, "src/modules/client/features/auto-market/services/autoMarketExtendedSignals.js"), "utf8");
  for (const needle of [
    "buildSearchHoldGuidance",
    "buildWarrantyBadgeSet",
    "buildReservationReadinessStates",
    "buildDealerTierBenefits",
    "buildResidualSignalRail"
  ]) {
    assert.equal(text.includes(needle), true, needle);
  }
});

test("pages are wired to new extended helper builders", () => {
  const pages = {
    "src/modules/client/features/auto-market/pages/SavedSearchesPage.jsx": ["buildSearchHoldGuidance"],
    "src/modules/client/features/auto-market/pages/DealerProfilePage.jsx": ["buildDealerTierBenefits", "buildReservationReadinessStates"],
    "src/modules/client/features/auto-market/pages/DetailsPage.jsx": ["buildWarrantyBadgeSet", "buildResidualSignalRail"],
    "src/modules/client/features/auto-market/pages/FavoritesPage.jsx": ["buildReservationReadinessStates"]
  };
  for (const [rel, needles] of Object.entries(pages)) {
    const text = fs.readFileSync(path.join(root, rel), "utf8");
    for (const needle of needles) assert.equal(text.includes(needle), true, `${rel} -> ${needle}`);
  }
});
