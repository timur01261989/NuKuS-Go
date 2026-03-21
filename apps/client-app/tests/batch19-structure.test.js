import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const root = process.cwd();

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

test("batch19 helper and logic files are wired", () => {
  const expected = [
    "src/services/supabase/authService.resolver.js",
    "src/modules/client/pages/pages/myAddresses.logic.js",
    "src/modules/client/pages/pages/myAddresses.sections.jsx",
    "src/modules/client/pages/pages/dashboard.logic.js",
    "src/modules/client/pages/pages/dashboard.sections.jsx",
    "src/modules/client/pages/pages/useMainPageController.js",
  ];

  expected.forEach((rel) => {
    assert.equal(fs.existsSync(path.join(root, rel)), true, `${rel} should exist`);
  });

  assert.match(read("src/services/supabase/authService.js"), /resolveAuthSessionState/);
  assert.match(read("src/modules/client/pages/pages/MyAddresses.jsx"), /useMyAddressesController/);
  assert.match(read("src/modules/client/pages/pages/Dashboard.jsx"), /useDashboardController/);
  assert.match(read("src/modules/client/pages/pages/MainPage.jsx"), /useMainPageController/);
});
