
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const bannedWords = [["ya","ndex"].join(""), ["yaa","ndex"].join(""), ["yan","go"].join("")];

test("batch62 buyer core services and page exist", () => {
  const files = [
    "src/modules/client/features/auto-market/services/autoMarketBuyerCore.js",
    "src/modules/client/features/auto-market/pages/SavedSearchesPage.jsx",
  ];
  for (const rel of files) {
    const content = fs.readFileSync(path.join(root, rel), "utf8");
    assert.ok(content.length > 80, rel);
  }
});

test("batch62 buyer core is wired into feed details compare and favorites", () => {
  const checks = {
    "src/modules/client/features/auto-market/pages/FeedPage.jsx": ["Qidiruvni saqlash", "budgetBrowseCards", "/auto-market/saved-searches"],
    "src/modules/client/features/auto-market/pages/DetailsPage.jsx": ["buildOwnershipEstimate", "Qarorni yengillashtiruvchi checklist"],
    "src/modules/client/features/auto-market/pages/ComparePage.jsx": ["buildCompareWinner", "Eng qulay variant:"],
    "src/modules/client/features/auto-market/pages/FavoritesPage.jsx": ["Hozirgi filtrni saqlash", "Saqlangan qidiruvlar"],
    "src/modules/client/features/auto-market/components/Feed/SmartFilterBar.jsx": ["buildBuyerQuickFilters"],
    "src/modules/client/features/auto-market/AutoMarketEntry.jsx": ["/saved-searches", "SavedSearchesPage"],
  };
  for (const [rel, needles] of Object.entries(checks)) {
    const content = fs.readFileSync(path.join(root, rel), "utf8");
    for (const needle of needles) assert.ok(content.includes(needle), `${rel}:${needle}`);
  }
});

test("batch62 touched files do not contain banned vendor literals", () => {
  const files = [
    "src/modules/client/features/auto-market/services/autoMarketBuyerCore.js",
    "src/modules/client/features/auto-market/pages/SavedSearchesPage.jsx",
    "src/modules/client/features/auto-market/pages/FeedPage.jsx",
    "src/modules/client/features/auto-market/pages/DetailsPage.jsx",
    "src/modules/client/features/auto-market/pages/ComparePage.jsx",
    "src/modules/client/features/auto-market/pages/FavoritesPage.jsx",
    "src/modules/client/features/auto-market/components/Feed/SmartFilterBar.jsx",
    "src/modules/client/features/auto-market/AutoMarketEntry.jsx",
  ];
  for (const rel of files) {
    const content = fs.readFileSync(path.join(root, rel), "utf8").toLowerCase();
    for (const word of bannedWords) assert.equal(content.includes(word), false, `${rel}:${word}`);
  }
});
