import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const exists = (rel) => fs.existsSync(path.join(root, rel));
const bannedWords = [["ya","ndex"].join(""), ["yaa","ndex"].join(""), ["yan","go"].join("")];

test("batch72 extended assets and service exist", () => {
  [
    "src/assets/auto-market/extended/index.js",
    "src/assets/auto-market/extended/auto-market-extended-phase1.manifest.json",
    "src/modules/client/features/auto-market/services/autoMarketExtendedSignals.js",
  ].forEach((rel) => assert.ok(exists(rel), rel));
});

test("batch72 key pages consume extended auto-market signals", () => {
  const details = read("src/modules/client/features/auto-market/pages/DetailsPage.jsx");
  const filters = read("src/modules/client/features/auto-market/components/Filters/FullFilterDrawer.jsx");
  const dealer = read("src/modules/client/features/auto-market/pages/DealerProfilePage.jsx");
  const notifications = read("src/modules/client/features/auto-market/pages/AutoMarketNotificationsPage.jsx");
  const favorites = read("src/modules/client/features/auto-market/pages/FavoritesPage.jsx");
  const feed = read("src/modules/client/features/auto-market/pages/FeedPage.jsx");
  for (const needle of ["buildWarrantyReservationSignals", "buildVinInsightCard"]) assert.ok(details.includes(needle), needle);
  for (const needle of ["buildBodyColorOptions", "buildFilterAssistVisual"]) assert.ok(filters.includes(needle), needle);
  assert.ok(dealer.includes("buildDealerTierProfile"));
  assert.ok(notifications.includes("buildNotificationSignalDeck"));
  assert.ok(favorites.includes("buildFavoritesEmptyState"));
  assert.ok(feed.includes("buildExtendedBrowseCards"));
});

test("batch72 files stay vendor-clean", () => {
  const files = [
    "src/assets/auto-market/extended/index.js",
    "src/modules/client/features/auto-market/services/autoMarketExtendedSignals.js",
    "src/modules/client/features/auto-market/pages/DetailsPage.jsx",
    "src/modules/client/features/auto-market/pages/DealerProfilePage.jsx",
    "src/modules/client/features/auto-market/pages/AutoMarketNotificationsPage.jsx",
    "tests/batch72-auto-market-extended-assets.test.js",
  ];
  for (const rel of files) {
    const text = read(rel).toLowerCase();
    for (const banned of bannedWords) {
      assert.equal(text.includes(banned), false, `${rel} contains banned vendor literal`);
    }
  }
});