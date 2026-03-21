import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

test("seller studio service exists", () => {
  const text = read("src/modules/client/features/auto-market/services/autoMarketSellerStudio.js");
  assert.match(text, /buildListingCompleteness/);
  assert.match(text, /buildPricingRecommendation/);
  assert.match(text, /buildPromotePackages/);
});

test("create ad wizard includes draft, completeness and promote sections", () => {
  const text = read("src/modules/client/features/auto-market/components/Create/CreateAdWizard.jsx");
  assert.match(text, /Draft saqlash/);
  assert.match(text, /Listing completeness/);
  assert.match(text, /Narx tavsiyasi/);
  assert.match(text, /Promote \/ VIP tayyorligi/);
});

test("seller leads and promote page are wired", () => {
  const routes = read("src/modules/client/features/auto-market/AutoMarketEntry.jsx");
  assert.match(routes, /\/seller\/leads/);
  assert.match(routes, /\/promote\/:id/);
  const leads = read("src/modules/client/features/auto-market/pages/SellerLeadsPage.jsx");
  assert.match(leads, /Follow-up/);
  const page = read("src/modules/client/features/auto-market/pages/PromoteListingPage.jsx");
  assert.match(page, /Promote listing/);
});
