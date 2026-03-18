import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const bannedWords = [["ya","ndex"].join(""), ["yaa","ndex"].join(""), ["yan","go"].join("")];

test("batch68 marketplace services persist and expose real-flow links", () => {
  const booking = read("src/modules/client/features/auto-market/services/autoMarketBookingCheckout.js");
  const payments = read("src/modules/client/features/auto-market/services/autoMarketLocalPayments.js");
  const finalService = read("src/modules/client/features/auto-market/services/autoMarketMarketplaceFinal.js");
  for (const needle of ["saveBookingEvent", "listBookingEvents", "savePaymentEvent", "listPaymentEvents", "buildAutoMarketNotifications"]) {
    assert.ok((booking + payments + finalService).includes(needle), needle);
  }
});

test("batch68 pages wire dealer finance and notifications into real routes", () => {
  const dealerService = read("src/modules/client/features/auto-market/services/autoMarketMarketplaceFinal.js");
  const finance = read("src/modules/client/features/auto-market/pages/FinanceOffersPage.jsx");
  const notifications = read("src/modules/client/features/auto-market/pages/AutoMarketNotificationsPage.jsx");
  const seller = read("src/modules/client/features/auto-market/components/Details/SellerProfile.jsx");
  assert.match(dealerService, /\/auto-market\/seller\/leads/);
  assert.match(finance, /Checkoutni ochish/);
  assert.match(notifications, /item\.route/);
  assert.match(seller, /Dealer profili/);
});

test("batch68 touched files contain no banned vendor literals", () => {
  const files = [
    "src/modules/client/features/auto-market/services/autoMarketBookingCheckout.js",
    "src/modules/client/features/auto-market/services/autoMarketLocalPayments.js",
    "src/modules/client/features/auto-market/services/autoMarketMarketplaceFinal.js",
    "src/modules/client/features/auto-market/pages/DealerProfilePage.jsx",
    "src/modules/client/features/auto-market/pages/FinanceOffersPage.jsx",
    "src/modules/client/features/auto-market/pages/AutoMarketNotificationsPage.jsx",
    "src/modules/client/features/auto-market/pages/PriceHistoryPage.jsx",
    "src/modules/client/features/auto-market/components/Details/SellerProfile.jsx",
  ];
  for (const rel of files) {
    const content = read(rel).toLowerCase();
    for (const banned of bannedWords) {
      assert.equal(content.includes(banned), false, `${rel}:${banned}`);
    }
  }
});
