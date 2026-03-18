import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const bannedWords = [["ya","ndex"].join(""), ["yaa","ndex"].join(""), ["yan","go"].join("")];

test("batch65 payment receipt flow files and routes exist", () => {
  const files = [
    "src/modules/client/features/auto-market/pages/PaymentReceiptPage.jsx",
    "src/modules/client/features/auto-market/services/autoMarketLocalPayments.js",
    "src/modules/client/features/auto-market/components/Details/BookingCheckoutCard.jsx",
    "src/modules/client/features/auto-market/pages/SellerAppointmentsPage.jsx",
  ];
  for (const rel of files) {
    const content = fs.readFileSync(path.join(root, rel), "utf8");
    assert.ok(content.length > 120, rel);
  }
  const routes = fs.readFileSync(path.join(root, "src/modules/client/features/auto-market/AutoMarketEntry.jsx"), "utf8");
  assert.match(routes, /booking\/\:id\/receipt/);
});

test("batch65 receipt and retry wiring is present", () => {
  const receiptPage = fs.readFileSync(path.join(root, "src/modules/client/features/auto-market/pages/PaymentReceiptPage.jsx"), "utf8");
  for (const needle of ["buildPaymentReceipt", "buildPaymentRetryOptions", "buildPaymentStatusTimeline", "Seller leads markaziga o‘tish"]) {
    assert.ok(receiptPage.includes(needle), needle);
  }

  const bookingCard = fs.readFileSync(path.join(root, "src/modules/client/features/auto-market/components/Details/BookingCheckoutCard.jsx"), "utf8");
  assert.ok(bookingCard.includes("Payment va receipt holati"));
  assert.ok(bookingCard.includes("onConfirm?.(state)"));

  const myAds = fs.readFileSync(path.join(root, "src/modules/client/features/auto-market/pages/MyAdsPage.jsx"), "utf8");
  assert.ok(myAds.includes("Appointment agenda"));
});

test("batch65 touched files contain no banned vendor literals", () => {
  const files = [
    "src/modules/client/features/auto-market/pages/PaymentReceiptPage.jsx",
    "src/modules/client/features/auto-market/services/autoMarketLocalPayments.js",
    "src/modules/client/features/auto-market/pages/BookingCheckoutPage.jsx",
    "src/modules/client/features/auto-market/components/Details/BookingCheckoutCard.jsx",
    "src/modules/client/features/auto-market/pages/SellerAppointmentsPage.jsx",
    "src/modules/client/features/auto-market/pages/MyAdsPage.jsx",
    "src/modules/client/features/auto-market/AutoMarketEntry.jsx",
  ];
  for (const rel of files) {
    const content = fs.readFileSync(path.join(root, rel), "utf8").toLowerCase();
    for (const banned of bannedWords) {
      assert.equal(content.includes(banned), false, `${rel}:${banned}`);
    }
  }
});
