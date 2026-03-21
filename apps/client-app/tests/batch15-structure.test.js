import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("batch15 helper files exist", () => {
  [
    "src/modules/client/features/auth/pages/auth.helpers.js",
    "src/modules/driver/legacy/components/driverAuth.helpers.jsx",
    "src/modules/client/pages/pages/myAddresses.helpers.jsx",
    "src/modules/driver/legacy/components/driverOrderFeed.helpers.jsx",
  ].forEach((rel) => assert.equal(fs.existsSync(path.join(root, rel)), true, rel));
});

test("batch15 primary files use extracted helpers or newer logic modules", () => {
  assert.ok(/auth\.helpers|auth\.logic/.test(read("src/modules/client/features/auth/pages/Auth.jsx")));
  assert.ok(/myAddresses\.helpers|myAddresses\.logic|myAddresses\.sections/.test(read("src/modules/client/pages/pages/MyAddresses.jsx")));
  assert.ok(/driverAuth\.helpers|driverAuth\.logic/.test(read("src/modules/driver/legacy/components/DriverAuth.jsx")));
  assert.ok(/driverOrderFeed\.helpers|driverOrderFeed\.logic/.test(read("src/modules/driver/legacy/components/DriverOrderFeed.jsx")));
});
