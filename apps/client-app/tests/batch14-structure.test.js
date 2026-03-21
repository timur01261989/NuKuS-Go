import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("batch14 helper files exist", () => {
  [
    "src/modules/driver/legacy/pages/driverDashboard.helpers.jsx",
    "src/modules/client/features/client/pages/clientReferral.helpers.js",
    "server/api/payments.shared.js",
    "src/modules/client/features/auth/pages/register.content.js",
  ].forEach((rel) => assert.equal(fs.existsSync(path.join(root, rel)), true, rel));
});

test("batch14 main files import new helpers", () => {
  const dashboard = read("src/modules/driver/legacy/pages/DriverDashboard.jsx");
  const referral = read("src/modules/client/features/client/pages/ClientReferral.jsx");
  const payments = read("server/api/payments.js");
  const register = read("src/modules/client/features/auth/pages/Register.jsx");

  assert.match(dashboard, /driverDashboard\.helpers/);
  assert.ok(/clientReferral\.helpers/.test(referral) || /clientReferral\.logic/.test(referral));
  assert.match(payments, /payments\.shared/);
  assert.ok(/register\.content/.test(register) || /register\.logic/.test(register));
});

test("payments reservation and capture helpers are wired", () => {
  const payments = read("server/api/payments.js");
  assert.match(payments, /reserveWalletAmount/);
  assert.match(payments, /captureReservedWalletAmount/);
});
