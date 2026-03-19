
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

function read(rel) {
  return fs.readFileSync(path.join(projectRoot, rel), "utf8");
}

test("shared delivery and freight domain status maps exist", () => {
  const delivery = read("src/modules/shared/domain/delivery/statusMap.js");
  const freight = read("src/modules/shared/domain/freight/statusMap.js");
  assert.match(delivery, /DELIVERY_CANONICAL_STATUSES/);
  assert.match(delivery, /normalizeDeliveryOrder/);
  assert.match(freight, /FREIGHT_CANONICAL_STATUSES/);
  assert.match(freight, /normalizeFreightStatus/);
});

test("delivery integration now uses delivery_orders as source of truth", () => {
  const content = read("src/modules/driver/legacy/delivery-integration/services/integrationApi.js");
  assert.match(content, /delivery_orders/);
  assert.match(content, /driver_update_status/);
});

test("delivery realtime socket subscribes to delivery_orders table", () => {
  const content = read("src/modules/driver/legacy/delivery-integration/hooks/useParcelSocket.js");
  assert.match(content, /delivery_orders:realtime/);
  assert.match(content, /table: "delivery_orders"/);
});

test("freight helpers import missing React hooks and reverse geocode", () => {
  const content = read("src/modules/driver/legacy/freight/FreightPage.helpers.jsx");
  assert.match(content, /useCallback/);
  assert.match(content, /useRef/);
  assert.match(content, /useState/);
  assert.match(content, /nominatimReverse/);
});

test("client freight page normalizes freight status and logs source-of-truth failures", () => {
  const content = read("src/modules/client/features/client/freight/ClientFreightPage.jsx");
  assert.match(content, /normalizeFreightStatus/);
  assert.match(content, /isFreightTerminalStatus/);
  assert.match(content, /logisticsLogger/);
});
