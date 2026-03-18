import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = "/mnt/data/batch61_work";

test("batch61 booking checkout va leads fayllari mavjud", () => {
  const files = [
    "src/modules/client/features/auto-market/pages/BookingCheckoutPage.jsx",
    "src/modules/client/features/auto-market/pages/SellerLeadsPage.jsx",
    "src/modules/client/features/auto-market/components/Details/BookingCheckoutCard.jsx",
    "src/modules/client/features/auto-market/components/Seller/SellerLeadCard.jsx",
    "src/modules/client/features/auto-market/services/autoMarketBookingCheckout.js",
    "src/modules/client/features/auto-market/services/autoMarketLeads.js",
  ];
  files.forEach((file) => assert.equal(fs.existsSync(path.join(root, file)), true, file));
});

test("batch61 route va navigation ulanadi", () => {
  const routes = fs.readFileSync(path.join(root, "src/modules/client/features/auto-market/AutoMarketEntry.jsx"), "utf8");
  assert.match(routes, /booking\/\:id\/checkout/);
  assert.match(routes, /seller\/leads/);

  const details = fs.readFileSync(path.join(root, "src/modules/client/features/auto-market/pages/DetailsPage.jsx"), "utf8");
  assert.match(details, /auto-market\/booking\/\$\{car\.id\}\/checkout/);

  const myAds = fs.readFileSync(path.join(root, "src/modules/client/features/auto-market/pages/MyAdsPage.jsx"), "utf8");
  assert.match(myAds, /auto-market\/seller\/leads/);
});

test("batch61 brend izi yo'q", () => {
  const files = [
    "src/modules/client/features/auto-market/pages/BookingCheckoutPage.jsx",
    "src/modules/client/features/auto-market/pages/SellerLeadsPage.jsx",
    "src/modules/client/features/auto-market/components/Details/BookingCheckoutCard.jsx",
    "src/modules/client/features/auto-market/components/Seller/SellerLeadCard.jsx",
    "src/modules/client/features/auto-market/services/autoMarketBookingCheckout.js",
    "src/modules/client/features/auto-market/services/autoMarketLeads.js",
    "BATCH61_AUTO_MARKET_BOOKING_CHECKOUT_LEADS_CHANGED_FILES.txt",
  ];
  files.forEach((file) => {
    const text = fs.readFileSync(path.join(root, file), "utf8").toLowerCase();
    const bannedA = ["y","a","n","d","e","x"].join("");
    const bannedB = ["y","a","a","n","d","e","x"].join("");
    const bannedC = ["y","a","n","g","o"].join("");
    assert.equal(text.includes(bannedA), false, file);
    assert.equal(text.includes(bannedB), false, file);
    assert.equal(text.includes(bannedC), false, file);
  });
});
