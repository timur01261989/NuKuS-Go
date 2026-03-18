import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

test("shared domain SDKs exist for delivery and freight", () => {
  assert.ok(fs.existsSync(path.join(root, "src/modules/shared/domain/delivery/deliverySdk.js")));
  assert.ok(fs.existsSync(path.join(root, "src/modules/shared/domain/freight/freightSdk.js")));
});

test("delivery page uses controller and extracted sections", () => {
  const page = read("src/modules/client/features/client/delivery/DeliveryPage.jsx");
  assert.match(page, /useDeliveryPageController/);
  assert.match(page, /DeliveryRequestForm/);
  assert.match(page, /DeliveryOrdersSection/);
});

test("freight driver page uses controller and extracted setup deck", () => {
  const page = read("src/modules/driver/legacy/freight/FreightPage.jsx");
  assert.match(page, /useFreightDriverController/);
  assert.match(page, /FreightVehicleSetupCard/);
  assert.match(page, /FreightStatusDeck/);
});