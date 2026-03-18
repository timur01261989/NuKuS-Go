import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const exists = (rel) => fs.existsSync(path.join(root, rel));

test("batch13 split files exist", () => {
  [
    "src/modules/client/pages/pages/mainPage.sections.jsx",
    "src/modules/driver/legacy/DriverRegistration/driverRegister.helpers.jsx",
    "src/modules/client/features/client/taxi/hooks/useTaxiOrder.core.helpers.js",
    "src/modules/client/features/client/components/clientOrderCreate.sections.jsx",
  ].forEach((rel) => assert.equal(exists(rel), true, rel));
});

test("batch13 main files import extracted modules", () => {
  const mainPage = read("src/modules/client/pages/pages/MainPage.jsx");
  const driverRegister = read("src/modules/driver/legacy/DriverRegistration/DriverRegister.jsx");
  const taxiCore = read("src/modules/client/features/client/taxi/hooks/useTaxiOrder.core.js");
  const clientOrder = read("src/modules/client/features/client/components/ClientOrderCreate.jsx");

  assert.ok(mainPage.includes("mainPage.sections") || mainPage.includes("useMainPageController"));
  assert.ok(driverRegister.includes("driverRegister.helpers"));
  assert.ok(taxiCore.includes("useTaxiOrder.core.helpers"));
  assert.ok(clientOrder.includes("clientOrderCreate.sections"));
});
