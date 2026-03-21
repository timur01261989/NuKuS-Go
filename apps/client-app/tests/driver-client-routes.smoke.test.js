import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

test("route smoke: canonical driver and client routes remain stable", () => {
  const content = fs.readFileSync(path.join(root, "src/app/router/routePaths.js"), "utf8");
  for (const route of ['home: "/"', 'delivery: "/delivery"', 'intercity: "/intercity"', 'home: "/driver"', 'pending: "/driver/pending"', 'settings: "/driver/settings"']) {
    assert.match(content, new RegExp(route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("driver smoke: legacy driver pages are controller-based now", () => {
  const files = [
    "src/modules/driver/legacy/components/DriverAuth.jsx",
    "src/modules/driver/legacy/components/DriverHome.jsx",
    "src/modules/driver/legacy/components/DriverOrderFeed.jsx",
    "src/modules/driver/legacy/pages/DriverSettingsPage.jsx",
  ];
  const expected = [
    "useDriverAuthController",
    "useDriverHomeController",
    "useDriverOrderFeedController",
    "useDriverSettingsController",
  ];
  files.forEach((rel, idx) => {
    const content = fs.readFileSync(path.join(root, rel), "utf8");
    assert.match(content, new RegExp(expected[idx]));
  });
});
