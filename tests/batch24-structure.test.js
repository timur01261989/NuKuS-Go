
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

test("payments module exposes testables for wallet flow integration coverage", () => {
  const content = fs.readFileSync(path.join(root, "server/api/payments.js"), "utf8");
  assert.match(content, /export const __testables/);
  assert.match(content, /handleWalletCheckout/);
  assert.match(content, /handleWalletComplete/);
});

test("batch24 integration tests are present", () => {
  const files = [
    "tests/payments-wallet-flow.integration.test.js",
    "tests/access-flow.integration.test.js",
    "tests/market-mode.integration.test.js",
  ];
  for (const rel of files) {
    assert.equal(fs.existsSync(path.join(root, rel)), true, rel);
  }
});
