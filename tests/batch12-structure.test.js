import fs from "fs";
import path from "path";
import test from "node:test";
import assert from "node:assert/strict";

const root = process.cwd();

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

test("batch12 helper files exist", () => {
  [
    "src/services/supabase/authService.helpers.js",
    "src/services/referralLinkService.helpers.js",
    "src/modules/client/features/auto-market/services/marketApi.helpers.js",
    "src/modules/client/features/client/freight/ClientFreightPage.helpers.jsx",
  ].forEach((rel) => {
    assert.equal(fs.existsSync(path.join(root, rel)), true, rel);
  });
});

test("batch12 main files import extracted helpers", () => {
  assert.match(read("src/services/supabase/authService.js"), /from "\.\/authService\.helpers\.js"/);
  assert.match(read("src/services/referralLinkService.js"), /from "\.\/referralLinkService\.helpers\.js"/);
  assert.match(read("src/modules/client/features/auto-market/services/marketApi.js"), /from "\.\/marketApi\.helpers"/);
  assert.match(read("src/modules/client/features/client/freight/ClientFreightPage.jsx"), /from "\.\/ClientFreightPage\.helpers\.jsx"/);
});
