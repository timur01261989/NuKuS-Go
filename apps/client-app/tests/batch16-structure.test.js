import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const exists = (rel) => fs.existsSync(path.join(root, rel));

test("batch16 driver legacy helper files exist", () => {
  [
    "src/modules/driver/legacy/components/driverHome.selectors.js",
    "src/modules/driver/legacy/components/driverHome.sections.jsx",
    "src/modules/driver/legacy/components/driverAuth.logic.js",
    "src/modules/driver/legacy/pages/driverSettings.logic.js",
    "src/modules/driver/legacy/components/driverOrderFeed.logic.js",
  ].forEach((rel) => assert.equal(exists(rel), true, rel));
});

test("batch16 driver legacy pages wire new modules", () => {
  assert.ok(/driverHome\.sections|useDriverHomeController|driverHome\.selectors/.test(read("src/modules/driver/legacy/components/DriverHome.jsx")));
  assert.ok(/driverAuth\.logic|useDriverAuthController/.test(read("src/modules/driver/legacy/components/DriverAuth.jsx")));
  assert.ok(/driverSettings\.logic|useDriverSettingsController/.test(read("src/modules/driver/legacy/pages/DriverSettingsPage.jsx")));
  assert.ok(/driverOrderFeed\.logic|useDriverOrderFeedController/.test(read("src/modules/driver/legacy/components/DriverOrderFeed.jsx")));
});
