import fs from "fs";
import path from "path";
import test from "node:test";
import assert from "node:assert/strict";

const root = process.cwd();

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

test("batch8 helper modules are wired into semiz client pages", () => {
  const delivery = read("src/modules/client/features/client/delivery/DeliveryPage.jsx");
  const intercity = read("src/modules/client/features/client/intercity/ClientIntercityPage.jsx");
  const market = read("src/modules/client/features/auto-market/services/marketBackend.js");

  assert.match(delivery, /DeliveryPage\.helpers/);
  assert.match(intercity, /ClientIntercityPage\.helpers/);
  assert.match(market, /marketBackend\.helpers/);
  assert.match(market, /marketPayments/);

  assert.ok(fs.existsSync(path.join(root, "src/modules/client/features/client/delivery/DeliveryPage.helpers.jsx")));
  assert.ok(fs.existsSync(path.join(root, "src/modules/client/features/client/intercity/ClientIntercityPage.helpers.jsx")));
  assert.ok(fs.existsSync(path.join(root, "src/modules/client/features/auto-market/services/marketBackend.helpers.js")));
  assert.ok(fs.existsSync(path.join(root, "src/modules/client/features/auto-market/services/marketPayments.js")));
});
