import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

test("batch25 smoke tests are present", () => {
  const files = [
    "tests/auth-register.smoke.test.js",
    "tests/delivery-referral.smoke.test.js",
    "tests/driver-client-routes.smoke.test.js",
  ];
  for (const rel of files) {
    assert.equal(fs.existsSync(path.join(root, rel)), true, rel);
  }
});

test("delivery logic uses pure helper module for smoke-testable imports", () => {
  const content = fs.readFileSync(path.join(root, "src/modules/client/features/client/delivery/DeliveryPage.logic.js"), "utf8");
  assert.match(content, /deliveryPure\.js/);
});
