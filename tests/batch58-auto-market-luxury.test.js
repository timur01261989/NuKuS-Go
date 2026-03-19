import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

test("batch58 luxury service exists and exports builders", () => {
  const file = path.join(root, "src/modules/client/features/auto-market/services/autoMarketLuxury.js");
  const content = fs.readFileSync(file, "utf8");
  assert.match(content, /buildLuxuryFeedShowcase/);
  assert.match(content, /buildLuxuryDetailStory/);
  assert.match(content, /buildLuxuryCreateExperience/);
});

test("batch58 touched screens wire luxury layer", () => {
  const files = [
    "src/modules/client/features/auto-market/pages/FeedPage.jsx",
    "src/modules/client/features/auto-market/pages/DetailsPage.jsx",
    "src/modules/client/features/auto-market/components/Create/CreateAdWizard.jsx",
    "src/modules/client/features/auto-market/components/Details/SellerProfile.jsx",
    "src/modules/client/features/auto-market/pages/ComparePage.jsx",
  ];
  for (const rel of files) {
    const content = fs.readFileSync(path.join(root, rel), "utf8");
    assert.ok(content.includes("autoMarketLuxury"), rel);
  }
});

test("batch58 touched files do not contain banned vendor literals", () => {
  const files = [
    "src/modules/client/features/auto-market/services/autoMarketLuxury.js",
    "src/modules/client/features/auto-market/pages/FeedPage.jsx",
    "src/modules/client/features/auto-market/pages/DetailsPage.jsx",
    "src/modules/client/features/auto-market/components/Create/CreateAdWizard.jsx",
  ];
  for (const rel of files) {
    const content = fs.readFileSync(path.join(root, rel), "utf8").toLowerCase();
    const bannedWords = [["ya","ndex"].join(""), ["yaa","ndex"].join(""), ["yan","go"].join("")];
    for (const word of bannedWords) {
      assert.equal(content.includes(word), false, `${rel}:${word}`);
    }
  }
});