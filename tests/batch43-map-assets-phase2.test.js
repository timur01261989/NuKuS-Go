import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const root = process.cwd();

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

test("batch43 map assets phase2 ui integration", async (t) => {
  await t.test("main map barrel exposes curated map asset aliases", () => {
    const barrel = read("src/assets/map/index.js");
    assert.equal(barrel.includes('export * from "./curated/index.js";'), true);
    assert.equal(barrel.includes("mapAssets.controlCompass = curatedMapAssets.pickup.mapControlCompass;"), true);
    assert.equal(barrel.includes("mapAssets.searchCar = curatedMapAssets.pickup.mapSearchCar;"), true);
    assert.equal(barrel.includes("mapAssets.poiGasFill = curatedMapAssets.poi.poiGasFill;"), true);
  });

  await t.test("map control surface consumes curated map icons", () => {
    const controls = read("src/modules/client/features/map/controls/MapRightControls.jsx");
    assert.equal(controls.includes('from "@/assets/map"'), true);
    assert.equal(controls.includes("mapAssets.controlLocation"), true);
    assert.equal(controls.includes("mapAssets.controlParking"), true);
    assert.equal(controls.includes("mapAssets.controlTraffic"), true);
  });

  await t.test("taxi and order map surfaces consume curated pickup/dropoff visuals", () => {
    const taxiArtifacts = read("src/modules/client/features/client/taxi/taxiMapArtifacts.jsx");
    const orderCreate = read("src/modules/client/features/client/components/clientOrderCreate.helpers.js");
    const freight = read("src/modules/client/features/client/freight/map/FreightMap.jsx");
    const intercity = read("src/modules/client/features/client/intercity/ClientIntercityPage.helpers.jsx");
    const addresses = read("src/modules/client/pages/pages/myAddresses.helpers.jsx");
    const deliveryHelpers = read("src/modules/client/features/client/delivery/DeliveryPage.helpers.jsx");

    assert.equal(taxiArtifacts.includes("mapAssets.pickupPin || mapAssets.userPlacemark || mapAssets.userSelf"), true);
    assert.equal(taxiArtifacts.includes("mapAssets.finishPin || mapAssets.dropoffPin || mapAssets.routePoint"), true);
    assert.equal(orderCreate.includes("mapAssets.pickupPin || mapAssets.userPlacemark || mapAssets.userSelf"), true);
    assert.equal(orderCreate.includes("mapAssets.finishPin || mapAssets.dropoffPin || mapAssets.routePoint"), true);
    assert.equal(freight.includes("mapAssets.pickupPin || mapAssets.clientPinDay || mapAssets.pickupPointLive"), true);
    assert.equal(freight.includes("mapAssets.finishPin || mapAssets.dropoffPin || mapAssets.deliveryPointLive"), true);
    assert.equal(intercity.includes("mapAssets.finishPin || mapAssets.dropoffPin || mapAssets.routePoint"), true);
    assert.equal(addresses.includes("mapAssets.pickupPin || mapAssets.clientPinDay || mapAssets.routePointLive"), true);
    assert.equal(deliveryHelpers.includes("mapAssets.pickupPin || mapAssets.clientPinDay || mapAssets.pickupPointLive"), true);
    assert.equal(deliveryHelpers.includes("mapAssets.finishPin || mapAssets.dropoffPin || mapAssets.deliveryPointLive"), true);
  });

  await t.test("moving vehicle and courier marker surfaces consume curated map markers", () => {
    const vehicle = read("src/modules/client/features/client/taxi/components/VehicleMarker.jsx");
    const courier = read("src/modules/client/features/client/delivery/map/CourierMarker.jsx");
    assert.equal(vehicle.includes('from "@/assets/map"'), true);
    assert.equal(vehicle.includes("mapAssets.searchCarStart || mapAssets.searchCar || mapAssets.courierBikeMarker"), true);
    assert.equal(courier.includes('from "@/assets/map"'), true);
    assert.equal(courier.includes("mapAssets.courierBikeMarker"), true);
    assert.equal(courier.includes("mapAssets.searchCarStart || mapAssets.searchCar"), true);
  });
});
