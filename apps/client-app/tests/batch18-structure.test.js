import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const exists = (rel) => fs.existsSync(path.join(root, rel));
const contains = (rel, text) => fs.readFileSync(path.join(root, rel), "utf8").includes(text);

test("batch18 helper and logic files exist", () => {
  [
    "src/modules/client/features/client/pages/clientReferral.logic.js",
    "src/modules/client/features/auth/pages/auth.logic.js",
    "src/services/referralLinkService.storage.js",
    "src/modules/client/features/auto-market/services/marketApi.seed.js",
    "src/modules/client/features/client/taxi/hooks/useTaxiOrder.core.selectors.js",
    "src/modules/shared/utils/apiHelper.config.js",
  ].forEach((rel) => assert.equal(exists(rel), true, rel));
});

test("batch18 primary files are wired to new helpers", () => {
  assert.equal(contains("src/modules/client/features/client/pages/ClientReferral.jsx", "clientReferral.logic.js"), true);
  assert.equal(contains("src/modules/client/features/auth/pages/Auth.jsx", "auth.logic.js"), true);
  assert.equal(contains("src/services/referralLinkService.js", "referralLinkService.storage.js"), true);
  assert.equal(contains("src/modules/client/features/auto-market/services/marketApi.js", "marketApi.seed"), true);
  assert.equal(contains("src/modules/client/features/client/taxi/hooks/useTaxiOrder.core.js", "useTaxiOrder.core.selectors"), true);
  assert.equal(contains("src/modules/shared/utils/apiHelper.js", "apiHelper.config"), true);
});
