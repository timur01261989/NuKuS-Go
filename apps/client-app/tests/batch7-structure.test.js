import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("ClientOrderCreate uses extracted helper/section modules", () => {
  const page = read("src/modules/client/features/client/components/ClientOrderCreate.jsx");
  const helpers = read("src/modules/client/features/client/components/clientOrderCreate.helpers.js");
  const sections = read("src/modules/client/features/client/components/clientOrderCreate.sections.jsx");

  assert.ok(page.includes("clientOrderCreate.helpers") || page.includes("clientOrderCreate.sections"));
  assert.match(helpers, /export const TARIFFS|export function CenterTracker|pickupMarkerIcon/);
  assert.match(sections, /AcceptedPanel|DetailsDrawer|ChatModal|RatingModal/);
});

test("ClientTaxiPage uses extracted taxi map artifacts", () => {
  const page = read("src/modules/client/features/client/taxi/ClientTaxiPage.impl.jsx");
  const helpers = read("src/modules/client/features/client/taxi/taxiMapArtifacts.jsx");

  assert.ok(page.includes("taxiMapArtifacts"));
  assert.match(helpers, /pickupIcon|CenterWatcher|LocateMeButton/);
});

test("DriverSettingsPage uses extracted helper/section/logic modules", () => {
  const page = read("src/modules/driver/legacy/pages/DriverSettingsPage.jsx");
  const helpers = read("src/modules/driver/legacy/pages/driverSettings.helpers.js");
  const sections = read("src/modules/driver/legacy/pages/driverSettings.sections.jsx");

  assert.ok(page.includes("driverSettings.helpers") || page.includes("driverSettings.logic"));
  assert.ok(page.includes("driverSettings.sections"));
  assert.match(helpers, /normalizeServiceTypes|safeSelectVehicles|buildRegisterSummary/);
  assert.match(sections, /VehicleRequestModal|ServiceTypesEditor|VehicleCard/);
});
