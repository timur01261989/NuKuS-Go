import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("marketplace final pages and service exist", () => {
  [
    "src/modules/client/features/auto-market/pages/DealerProfilePage.jsx",
    "src/modules/client/features/auto-market/pages/FinanceOffersPage.jsx",
    "src/modules/client/features/auto-market/pages/AutoMarketNotificationsPage.jsx",
    "src/modules/client/features/auto-market/pages/PriceHistoryPage.jsx",
    "src/modules/client/features/auto-market/services/autoMarketMarketplaceFinal.js",
  ].forEach((file) => assert.equal(fs.existsSync(path.join(root, file)), true, file));
});

test("routes expose final marketplace pages", () => {
  const entry = read("src/modules/client/features/auto-market/AutoMarketEntry.jsx");
  [
    "/dealer/:sellerId",
    "/finance-offers/:id",
    "/notifications",
    "/price-history/:id",
  ].forEach((route) => assert.match(entry, new RegExp(route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))));
});

test("touched pages include marketplace center hooks", () => {
  const details = read("src/modules/client/features/auto-market/pages/DetailsPage.jsx");
  const feed = read("src/modules/client/features/auto-market/pages/FeedPage.jsx");
  const myAds = read("src/modules/client/features/auto-market/pages/MyAdsPage.jsx");
  assert.match(details, /Marketplace decision center/);
  assert.match(feed, /Marketplace center/);
  assert.match(myAds, /Marketplace final center/);
});

test("vendor literals absent in new final layer", () => {
  const files = [
    "src/modules/client/features/auto-market/services/autoMarketMarketplaceFinal.js",
    "src/modules/client/features/auto-market/pages/DealerProfilePage.jsx",
    "src/modules/client/features/auto-market/pages/FinanceOffersPage.jsx",
    "src/modules/client/features/auto-market/pages/AutoMarketNotificationsPage.jsx",
    "src/modules/client/features/auto-market/pages/PriceHistoryPage.jsx",
  ];
  const banned = [
    [121, 97, 110, 100, 101, 120],
    [121, 97, 97, 110, 100, 101, 120],
    [121, 97, 110, 103, 111],
  ].map((codes) => new RegExp(String.fromCharCode(...codes), "i"));
  for (const file of files) {
    const text = read(file);
    banned.forEach((needle) => assert.doesNotMatch(text, needle));
  }
});
