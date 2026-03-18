
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const bannedWords = [["ya","ndex"].join(""), ["yaa","ndex"].join(""), ["yan","go"].join("")];

test("batch64 booking checkout pipeline files exist", () => {
  const files = [
    "src/modules/client/features/auto-market/components/Details/AppointmentCalendar.jsx",
    "src/modules/client/features/auto-market/components/Details/SlotPicker.jsx",
    "src/modules/client/features/auto-market/pages/BookingCheckoutPage.jsx",
    "src/modules/client/features/auto-market/services/autoMarketBookingCheckout.js",
    "src/modules/client/features/auto-market/pages/SellerLeadsPage.jsx",
    "src/modules/client/features/auto-market/pages/SellerAppointmentsPage.jsx",
    "src/modules/client/features/auto-market/services/autoMarketLeads.js",
  ];
  for (const rel of files) {
    const content = fs.readFileSync(path.join(root, rel), "utf8");
    assert.ok(content.length > 80, rel);
  }
});

test("batch64 routes and crm wiring exist", () => {
  const routes = fs.readFileSync(path.join(root, "src/modules/client/features/auto-market/AutoMarketEntry.jsx"), "utf8");
  assert.match(routes, /\/booking\/:id\/checkout/);
  assert.match(routes, /\/seller\/leads/);
  assert.match(routes, /\/seller\/appointments/);

  const myAds = fs.readFileSync(path.join(root, "src/modules/client/features/auto-market/pages/MyAdsPage.jsx"), "utf8");
  assert.match(myAds, /seller\/appointments/);
  assert.match(myAds, /SellerCrmBoard/);
});

test("batch64 touched files have no banned vendor words", () => {
  const files = [
    "src/modules/client/features/auto-market/components/Details/AppointmentCalendar.jsx",
    "src/modules/client/features/auto-market/components/Details/SlotPicker.jsx",
    "src/modules/client/features/auto-market/components/Details/BookingCheckoutCard.jsx",
    "src/modules/client/features/auto-market/pages/BookingCheckoutPage.jsx",
    "src/modules/client/features/auto-market/services/autoMarketBookingCheckout.js",
    "src/modules/client/features/auto-market/services/autoMarketLeads.js",
    "src/modules/client/features/auto-market/components/Seller/SellerLeadCard.jsx",
    "src/modules/client/features/auto-market/pages/SellerLeadsPage.jsx",
    "src/modules/client/features/auto-market/pages/SellerAppointmentsPage.jsx",
  ];
  for (const rel of files) {
    const content = fs.readFileSync(path.join(root, rel), "utf8").toLowerCase();
    for (const bad of bannedWords) {
      assert.equal(content.includes(bad), false, `${bad} found in ${rel}`);
    }
  }
});
