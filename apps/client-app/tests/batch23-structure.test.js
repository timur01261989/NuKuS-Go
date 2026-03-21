
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

test("batch23 adds legacy and policy docs", () => {
  assert.equal(fs.existsSync(path.join(root, "src/modules/driver/legacy/LEGACY_NOTE.md")), true);
  assert.equal(fs.existsSync(path.join(root, "src/modules/client/pages/pages/LEGACY_NOTE.md")), true);
  assert.equal(fs.existsSync(path.join(root, "PWA_SW_POLICY.md")), true);
  assert.equal(fs.existsSync(path.join(root, "LOGGING_ERROR_POLICY.md")), true);
});

test("batch23 uses shared logger/error adapter in key client pages", () => {
  assert.match(read("src/modules/client/features/auth/pages/Auth.jsx"), /clientLogger/);
  assert.match(read("src/modules/client/features/auth/pages/Register.jsx"), /getErrorMessage/);
  assert.match(read("src/modules/client/features/client/delivery/DeliveryPage.jsx"), /delivery\.save_failed/);
});

test("batch23 centralizes auto market mode validation", () => {
  const text = read("src/modules/client/features/auto-market/services/marketMode.js");
  assert.match(text, /ALLOWED_MODES/);
  assert.match(text, /auto_market\.invalid_mode/);
});
