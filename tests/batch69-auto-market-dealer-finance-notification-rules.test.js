import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const bannedWords = [["ya","ndex"].join(""), ["yaa","ndex"].join(""), ["yan","go"].join("")];

test("batch69 marketplace final service exposes dealer reviews, finance calculator and notification rules", () => {
  const service = read("src/modules/client/features/auto-market/services/autoMarketMarketplaceFinal.js");
  for (const needle of ["buildDealerReviews", "buildFinanceCalculator", "buildNotificationRules"]) {
    assert.ok(service.includes(needle), needle);
  }
});

test("batch69 routes expose notification rules page", () => {
  const entry = read("src/modules/client/features/auto-market/AutoMarketEntry.jsx");
  assert.match(entry, /NotificationRulesPage/);
  assert.match(entry, /\/notifications\/rules/);
});

test("batch69 pages wire new marketplace final surfaces", () => {
  const dealer = read("src/modules/client/features/auto-market/pages/DealerProfilePage.jsx");
  const finance = read("src/modules/client/features/auto-market/pages/FinanceOffersPage.jsx");
  const notifications = read("src/modules/client/features/auto-market/pages/AutoMarketNotificationsPage.jsx");
  const rules = read("src/modules/client/features/auto-market/pages/NotificationRulesPage.jsx");
  assert.match(dealer, /Dealer review va rating/);
  assert.match(finance, /Finance calculator/);
  assert.match(notifications, /Rule markazini ochish/);
  assert.match(rules, /Alert, booking, finance va seller signal qoidalari/);
});

test("batch69 touched files contain no banned vendor literals", () => {
  const files = [
    "src/modules/client/features/auto-market/services/autoMarketMarketplaceFinal.js",
    "src/modules/client/features/auto-market/pages/DealerProfilePage.jsx",
    "src/modules/client/features/auto-market/pages/FinanceOffersPage.jsx",
    "src/modules/client/features/auto-market/pages/AutoMarketNotificationsPage.jsx",
    "src/modules/client/features/auto-market/pages/NotificationRulesPage.jsx",
    "src/modules/client/features/auto-market/AutoMarketEntry.jsx",
  ];
  for (const file of files) {
    const body = read(file).toLowerCase();
    for (const word of bannedWords) {
      assert.equal(body.includes(word), false, `${file} includes ${word}`);
    }
  }
});
