import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const bannedWords = [["ya","ndex"].join(""), ["yaa","ndex"].join(""), ["yan","go"].join("")];

test("batch60 booking, local payment and seller crm services exist", () => {
  const services = [
    "src/modules/client/features/auto-market/services/autoMarketBooking.js",
    "src/modules/client/features/auto-market/services/autoMarketLocalPayments.js",
    "src/modules/client/features/auto-market/services/autoMarketSellerCrm.js",
  ];
  for (const rel of services) {
    const content = fs.readFileSync(path.join(root, rel), "utf8");
    assert.ok(content.length > 40, rel);
  }
});

test("batch60 ui wiring exists in key auto-market files", () => {
  const checks = {
    "src/modules/client/features/auto-market/pages/DetailsPage.jsx": ["BookingFlowCard", "LocalPaymentOptionsCard"],
    "src/modules/client/features/auto-market/pages/MyAdsPage.jsx": ["SellerCrmBoard"],
    "src/modules/client/features/auto-market/components/Create/CreateAdWizard.jsx": ["localPaymentProviders", "Seller CRM readiness"],
    "src/modules/client/features/auto-market/components/Details/SellerProfile.jsx": ["getLocalPaymentProviders"],
  };
  for (const [rel, needles] of Object.entries(checks)) {
    const content = fs.readFileSync(path.join(root, rel), "utf8");
    for (const needle of needles) assert.ok(content.includes(needle), `${rel}:${needle}`);
  }
});

test("batch60 touched files do not contain banned vendor literals", () => {
  const files = [
    "src/modules/client/features/auto-market/services/autoMarketBooking.js",
    "src/modules/client/features/auto-market/services/autoMarketLocalPayments.js",
    "src/modules/client/features/auto-market/services/autoMarketSellerCrm.js",
    "src/modules/client/features/auto-market/components/Details/BookingFlowCard.jsx",
    "src/modules/client/features/auto-market/components/Details/LocalPaymentOptionsCard.jsx",
    "src/modules/client/features/auto-market/components/Seller/SellerCrmBoard.jsx",
    "src/modules/client/features/auto-market/pages/DetailsPage.jsx",
    "src/modules/client/features/auto-market/pages/MyAdsPage.jsx",
    "src/modules/client/features/auto-market/components/Create/CreateAdWizard.jsx",
    "src/modules/client/features/auto-market/components/Details/SellerProfile.jsx",
  ];
  for (const rel of files) {
    const content = fs.readFileSync(path.join(root, rel), "utf8").toLowerCase();
    for (const word of bannedWords) {
      assert.equal(content.includes(word), false, `${rel}:${word}`);
    }
  }
});
