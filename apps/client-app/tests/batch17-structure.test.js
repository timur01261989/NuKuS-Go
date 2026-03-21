import fs from "fs";
import path from "path";
import test from "node:test";
import assert from "node:assert/strict";

const root = process.cwd();

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

test("batch17 driver legacy controller files exist", () => {
  [
    "src/modules/driver/legacy/components/useDriverAuthController.js",
    "src/modules/driver/legacy/components/useDriverHomeController.js",
    "src/modules/driver/legacy/components/useDriverOrderFeedController.js",
    "src/modules/driver/legacy/pages/useDriverSettingsController.js",
  ].forEach((file) => assert.equal(fs.existsSync(path.join(root, file)), true, file));
});

test("driver legacy pages use controller hooks", () => {
  assert.match(read("src/modules/driver/legacy/components/DriverAuth.jsx"), /useDriverAuthController/);
  assert.match(read("src/modules/driver/legacy/components/DriverHome.jsx"), /useDriverHomeController/);
  assert.match(read("src/modules/driver/legacy/components/DriverOrderFeed.jsx"), /useDriverOrderFeedController/);
  assert.match(read("src/modules/driver/legacy/pages/DriverSettingsPage.jsx"), /useDriverSettingsController/);
});
