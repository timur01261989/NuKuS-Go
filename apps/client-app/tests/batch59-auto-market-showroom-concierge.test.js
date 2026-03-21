import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

test("showroom concierge service exists and exposes builders", () => {
  const file = path.join(root, "src/modules/client/features/auto-market/services/autoMarketShowroom.js");
  const text = fs.readFileSync(file, "utf8");
  assert.match(text, /buildShowroomConciergeDeck/);
  assert.match(text, /buildShowroomConciergePlan/);
  assert.match(text, /buildSellerConciergeActions/);
  assert.match(text, /buildCreateShowroomChecklist/);
});

test("showroom concierge layer wired into key auto-market pages", () => {
  const targets = [
    "src/modules/client/features/auto-market/pages/FeedPage.jsx",
    "src/modules/client/features/auto-market/pages/DetailsPage.jsx",
    "src/modules/client/features/auto-market/components/Create/CreateAdWizard.jsx",
    "src/modules/client/features/auto-market/pages/ComparePage.jsx",
    "src/modules/client/features/auto-market/pages/FavoritesPage.jsx",
    "src/modules/client/features/auto-market/pages/MyAdsPage.jsx",
  ];
  for (const rel of targets) {
    const text = fs.readFileSync(path.join(root, rel), "utf8");
    assert.match(text, /autoMarketShowroom/);
  }
});

test("forbidden vendor literals are not present in touched files", () => {
  const targets = [
    "src/modules/client/features/auto-market/services/autoMarketShowroom.js",
    "src/modules/client/features/auto-market/pages/FeedPage.jsx",
    "src/modules/client/features/auto-market/pages/DetailsPage.jsx",
    "src/modules/client/features/auto-market/components/Create/CreateAdWizard.jsx",
    "src/modules/client/features/auto-market/components/Details/SellerProfile.jsx",
    "src/modules/client/features/auto-market/pages/ComparePage.jsx",
    "src/modules/client/features/auto-market/pages/FavoritesPage.jsx",
    "src/modules/client/features/auto-market/pages/MyAdsPage.jsx",
  ];
  for (const rel of targets) {
    const text = fs.readFileSync(path.join(root, rel), "utf8").toLowerCase();
    for (const banned of ["yand" + "ex", "yaan" + "dex", "yan" + "go"]) {
      assert.equal(text.includes(banned), false, `${banned} found in ${rel}`);
    }
  }
});
