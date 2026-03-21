import fs from "fs";
import path from "path";
import test from "node:test";
import assert from "node:assert/strict";

const root = process.cwd();

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

test("batch11 helper files exist", () => {
  [
    "src/modules/driver/legacy/components/DriverHome.helpers.jsx",
    "src/modules/client/pages/pages/dashboard.helpers.jsx",
    "server/api/freight.shared.js",
  ].forEach((rel) => {
    assert.equal(fs.existsSync(path.join(root, rel)), true, rel);
  });
});

test("driver home uses helper module", () => {
  const txt = read("src/modules/driver/legacy/components/DriverHome.jsx");
  assert.ok(/DriverHome\.helpers\.jsx/.test(txt) || /driverHome\.sections\.jsx/.test(txt) || /useDriverHomeController\.js/.test(txt));
});

test("dashboard uses helper module", () => {
  const txt = read("src/modules/client/pages/pages/Dashboard.jsx");
  assert.ok(/dashboard\.helpers\.jsx/.test(txt) || /dashboard\.logic\.js/.test(txt) || /dashboard\.sections\.jsx/.test(txt));
});

test("freight api uses shared helper module", () => {
  const txt = read("server/api/freight.js");
  assert.match(txt, /\.\/freight\.shared\.js/);
});
