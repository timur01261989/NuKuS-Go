import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

test("batch70 final polish files exist", () => {
  const files = [
    "src/modules/client/features/auto-market/services/autoMarketFinalPolish.js",
    "src/modules/client/features/auto-market/pages/AutoMarketHubPage.jsx",
    "src/modules/client/features/auto-market/pages/FeedPage.jsx",
    "src/modules/client/features/auto-market/pages/DetailsPage.jsx",
    "src/modules/client/features/auto-market/pages/MyAdsPage.jsx",
    "src/modules/client/features/auto-market/pages/DealerProfilePage.jsx",
    "src/modules/client/features/auto-market/pages/FinanceOffersPage.jsx",
    "src/modules/client/features/auto-market/pages/AutoMarketNotificationsPage.jsx",
  ];
  files.forEach((file) => assert.equal(fs.existsSync(path.join(root, file)), true, file));
});

test("batch70 final polish routes exist", () => {
  const entry = fs.readFileSync(path.join(root, "src/modules/client/features/auto-market/AutoMarketEntry.jsx"), "utf8");
  assert.match(entry, /AutoMarketHubPage/);
  assert.match(entry, /path="\/hub"/);
});

test("batch70 touched files avoid banned vendor literals", () => {
  const files = [
    "src/modules/client/features/auto-market/services/autoMarketFinalPolish.js",
    "src/modules/client/features/auto-market/pages/AutoMarketHubPage.jsx",
    "src/modules/client/features/auto-market/pages/FeedPage.jsx",
    "src/modules/client/features/auto-market/pages/DetailsPage.jsx",
    "src/modules/client/features/auto-market/pages/MyAdsPage.jsx",
    "src/modules/client/features/auto-market/pages/DealerProfilePage.jsx",
    "src/modules/client/features/auto-market/pages/FinanceOffersPage.jsx",
    "src/modules/client/features/auto-market/pages/AutoMarketNotificationsPage.jsx",
  ];
  files.forEach((file) => {
    const txt = fs.readFileSync(path.join(root, file), "utf8").toLowerCase();
    const banned = [
      [121, 97, 110, 100, 101, 120],
      [121, 97, 97, 110, 100, 101, 120],
      [121, 97, 110, 103, 111],
    ].map((codes) => String.fromCharCode(...codes));
    banned.forEach((bad) => assert.equal(txt.includes(bad), false, `${file} contains banned source-brand text`));
  });
});
