
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const bannedWords = [["ya","ndex"].join(""), ["yaa","ndex"].join(""), ["yan","go"].join("")];

test("batch63 buyer core phase2 files and routes exist", () => {
  const files = [
    "src/modules/client/features/auto-market/pages/SavedAlertsPage.jsx",
    "src/modules/client/features/auto-market/services/autoMarketBuyerCore.js",
    "src/modules/client/features/auto-market/components/Filters/FullFilterDrawer.jsx",
  ];
  for (const rel of files) {
    const content = fs.readFileSync(path.join(root, rel), "utf8");
    assert.ok(content.length > 80, rel);
  }
  const routes = fs.readFileSync(path.join(root, "src/modules/client/features/auto-market/AutoMarketEntry.jsx"), "utf8");
  assert.match(routes, /saved-alerts/);
});

test("batch63 buyer core phase2 is wired into feed details favorites and filters", () => {
  const checks = {
    "src/modules/client/features/auto-market/pages/FeedPage.jsx": ["saveAlertDraft", "Saqlangan alertlar", "scenarioBrowseCards"],
    "src/modules/client/features/auto-market/pages/DetailsPage.jsx": ["Shu model uchun alert yoqish", "saveAlertDraft"],
    "src/modules/client/features/auto-market/pages/FavoritesPage.jsx": ["Narx va yangi e'lon alerti", "Saqlangan alertlar"],
    "src/modules/client/features/auto-market/components/Filters/FullFilterDrawer.jsx": ["Chuqur buyer filterlar", "priceDropOnly", "inspectionMin", "sellerType"],
    "src/modules/client/features/auto-market/services/marketApi.seed.js": ["priceDropOnly", "inspectionMin", "seller_type"],
  };
  for (const [rel, needles] of Object.entries(checks)) {
    const content = fs.readFileSync(path.join(root, rel), "utf8");
    for (const needle of needles) {
      assert.ok(content.includes(needle), `${rel}:${needle}`);
    }
  }
});

test("batch63 touched files contain no banned vendor literals", () => {
  const files = [
    "src/modules/client/features/auto-market/pages/SavedAlertsPage.jsx",
    "src/modules/client/features/auto-market/services/autoMarketBuyerCore.js",
    "src/modules/client/features/auto-market/pages/FeedPage.jsx",
    "src/modules/client/features/auto-market/pages/DetailsPage.jsx",
    "src/modules/client/features/auto-market/pages/FavoritesPage.jsx",
    "src/modules/client/features/auto-market/components/Filters/FullFilterDrawer.jsx",
    "src/modules/client/features/auto-market/AutoMarketEntry.jsx",
    "src/modules/client/features/auto-market/context/MarketContext.jsx",
  ];
  for (const rel of files) {
    const content = fs.readFileSync(path.join(root, rel), "utf8").toLowerCase();
    for (const banned of bannedWords) {
      assert.equal(content.includes(banned), false, `${rel}:${banned}`);
    }
  }
});
